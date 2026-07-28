from pathlib import Path

import tinycss2
from bs4 import BeautifulSoup

# ponytail: real browser checks (console errors, viewport overflow, screenshots)
# are skipped for v1 — this validates statically instead. Add Playwright-based
# checks (section 13.5) when live preview iframes stop catching real regressions.


def _local_asset_path(root: Path, html_path: Path, ref: str) -> Path | None:
    if not ref or ref.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:", "#", "javascript:")):
        return None
    ref = ref.split("#")[0].split("?")[0]
    if not ref:
        return None
    return (html_path.parent / ref).resolve()


def validate_html_file(root: Path, rel_path: str, original_ids: set[str] | None, original_classes: set[str] | None) -> list[str]:
    errors = []
    path = root / rel_path
    text = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(text, "lxml")

    if not soup.find("body") or not soup.get_text(strip=True):
        errors.append(f"{rel_path}: page appears empty")

    ids = [t.get("id") for t in soup.find_all(id=True)]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        errors.append(f"{rel_path}: duplicate IDs: {sorted(dupes)}")

    for tag in soup.find_all(["img"]):
        src = tag.get("src")
        asset = _local_asset_path(root, path, src)
        if asset is not None and not asset.exists():
            errors.append(f"{rel_path}: missing local asset {src}")

    for tag in soup.find_all("link", rel="stylesheet"):
        asset = _local_asset_path(root, path, tag.get("href"))
        if asset is not None and not asset.exists():
            errors.append(f"{rel_path}: missing stylesheet {tag.get('href')}")

    for tag in soup.find_all("script"):
        asset = _local_asset_path(root, path, tag.get("src"))
        if asset is not None and not asset.exists():
            errors.append(f"{rel_path}: missing script {tag.get('src')}")

    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:")):
            continue
        asset = _local_asset_path(root, path, href)
        if asset is not None and not asset.exists():
            errors.append(f"{rel_path}: broken internal link {href}")

    for form in soup.find_all("form"):
        for field in form.find_all(["input", "textarea", "select"]):
            if not field.get("name") and not field.get("id") and field.get("type") not in ("submit", "button"):
                errors.append(f"{rel_path}: form field missing name/id")

    if original_ids is not None:
        current_ids = set(ids)
        removed = original_ids - current_ids
        if removed:
            errors.append(f"{rel_path}: removed protected IDs: {sorted(removed)}")
    if original_classes is not None:
        current_classes = {c for t in soup.find_all(class_=True) for c in t.get("class", [])}
        removed = original_classes - current_classes
        if removed:
            errors.append(f"{rel_path}: removed protected classes: {sorted(removed)}")

    return errors


def validate_css_file(root: Path, rel_path: str) -> list[str]:
    errors = []
    path = root / rel_path
    text = path.read_text(encoding="utf-8", errors="replace")

    if not text.strip():
        errors.append(f"{rel_path}: stylesheet is empty")
        return errors

    if text.count("{") != text.count("}"):
        errors.append(f"{rel_path}: unmatched braces")

    rules = tinycss2.parse_stylesheet(text, skip_comments=True, skip_whitespace=True)
    for rule in rules:
        if getattr(rule, "type", None) == "error":
            errors.append(f"{rel_path}: CSS parse error: {rule.message}")
        if getattr(rule, "type", None) == "qualified-rule":
            decls = tinycss2.parse_declaration_list(rule.content, skip_comments=True, skip_whitespace=True)
            for decl in decls:
                if getattr(decl, "type", None) == "error":
                    errors.append(f"{rel_path}: malformed declaration: {decl.message}")

    return errors


def validate_js_unchanged(original_hashes: dict[str, str], root: Path, js_files: list[str]) -> list[str]:
    import hashlib
    errors = []
    for rel in js_files:
        path = root / rel
        if not path.exists():
            errors.append(f"{rel}: JavaScript file missing")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if original_hashes.get(rel) and digest != original_hashes[rel]:
            errors.append(f"{rel}: JavaScript was modified but JS editing is disabled")
    return errors


def validate_workspace(
    root: Path,
    manifest: dict,
    allow_js_changes: bool,
    original_js_hashes: dict[str, str] | None = None,
) -> dict:
    errors: list[str] = []
    protected_ids = set(manifest.get("protected_ids", []))
    protected_classes = set(manifest.get("protected_classes", []))

    for entry in manifest["files"]:
        if entry["type"] == "html":
            # scope the protected set to what THIS file originally had, not
            # every protected id/class in the whole project (a project-wide
            # set false-positives on multi-page sites and on JS hooks that
            # never had a matching HTML id in the first place).
            file_protected_ids = protected_ids & set(entry.get("ids", []))
            file_protected_classes = protected_classes & set(entry.get("classes", []))
            errors += validate_html_file(root, entry["path"], file_protected_ids, file_protected_classes)
        elif entry["type"] == "css":
            errors += validate_css_file(root, entry["path"])

    if not allow_js_changes and original_js_hashes:
        js_files = [f["path"] for f in manifest["files"] if f["type"] == "js"]
        errors += validate_js_unchanged(original_js_hashes, root, js_files)

    return {"passed": len(errors) == 0, "errors": errors}
