import re
from pathlib import Path

from . import config

WORD_RE = re.compile(r"[a-z0-9]+")

# A Tailwind page carries thousands of classes and selectors; sending them all
# exceeds the model's per-request budget (HTTP 413) long before it helps.
MAX_LIST_ITEMS = 40
_LIST_FIELDS = ("ids", "classes", "selectors", "headings", "components", "stylesheets", "scripts", "links", "images")


def _tokens(text: str) -> set[str]:
    return set(WORD_RE.findall(text.lower()))


def _file_text_blob(file_entry: dict) -> str:
    parts = [file_entry.get("path", "")]
    if file_entry.get("type") == "html":
        parts += [file_entry.get("title", ""), " ".join(file_entry.get("headings", []))]
        parts += [c["type"] for c in file_entry.get("components", [])]
        parts += file_entry.get("ids", []) + file_entry.get("classes", [])
    elif file_entry.get("type") == "css":
        parts += file_entry.get("selectors", [])
    return " ".join(parts)


def rank_files(manifest: dict, query: str, top_n: int = 6) -> list[str]:
    """Keyword-overlap ranking (section 8). Embeddings intentionally skipped
    for v1 per spec section 8 — swap in a vector index if recall becomes a
    problem on larger projects."""
    query_tokens = _tokens(query)
    scored = []
    for entry in manifest["files"]:
        blob_tokens = _tokens(_file_text_blob(entry))
        overlap = len(query_tokens & blob_tokens)
        if overlap or entry["path"] == manifest["entry_file"]:
            scored.append((overlap, entry["path"]))
    scored.sort(key=lambda x: (-x[0], x[1]))
    ranked = [path for _, path in scored[:top_n]]
    if not ranked:
        ranked = [manifest["entry_file"]]
    # always include stylesheets referenced by any selected HTML page
    for entry in manifest["files"]:
        if entry["path"] in ranked and entry.get("type") == "html":
            for css in entry.get("stylesheets", []):
                css_path = str(Path(entry["path"]).parent / css) if not css.startswith("/") else css.lstrip("/")
                for f in manifest["files"]:
                    if f["path"].endswith(css_path.lstrip("./")) and f["path"] not in ranked:
                        ranked.append(f["path"])
    return ranked


# Tailwind-style utility classes (px-4, lg:col-span-5, w-[80px]) make useless,
# unstable selectors -- skip them when naming an element.
_UTILITY_CLASS = re.compile(r"[:/\[\]]|\d")
_TARGETABLE_TAGS = ("h1", "h2", "h3", "h4", "p", "button", "a", "img", "section", "main", "header", "footer", "nav", "ul")


def selector_menu(html_text: str, limit: int = 30) -> list[dict]:
    """Real selectors taken from the document, with the text each one holds.

    Every failure mode we saw came from the model inventing a selector
    ('.hero-gradient .container') or aiming text edits at a wrapper. Handing it
    verified selectors removes the guesswork instead of punishing it after."""
    from bs4 import BeautifulSoup  # local import: retrieval is imported by light paths too

    soup = BeautifulSoup(html_text, "lxml")
    seen: set[str] = set()
    menu: list[dict] = []

    for el in soup.find_all(_TARGETABLE_TAGS):
        selector = None
        if el.get("id"):
            selector = f"#{el['id']}"
        else:
            for cls in el.get("class", [])[:5]:
                if not _UTILITY_CLASS.search(cls) and len(soup.select(f"{el.name}.{cls}")) == 1:
                    selector = f"{el.name}.{cls}"
                    break
            if selector is None and len(soup.find_all(el.name)) == 1:
                selector = el.name

        if not selector or selector in seen:
            continue
        seen.add(selector)
        menu.append({
            "selector": selector,
            "holds_text": not el.find(True),  # safe target for set_text
            "text": el.get_text(" ", strip=True)[:60],
        })
        if len(menu) >= limit:
            break
    return menu


def build_selector_menus(snippets: dict[str, str]) -> dict[str, list[dict]]:
    return {
        path: selector_menu(text)
        for path, text in snippets.items()
        if path.lower().endswith((".html", ".htm"))
    }


def _trim_lists(entry: dict) -> dict:
    """Cap the long list fields, flagging any that were cut so the model knows
    it is looking at a sample rather than the complete set."""
    trimmed = dict(entry)
    for key in _LIST_FIELDS:
        value = trimmed.get(key)
        if isinstance(value, list) and len(value) > MAX_LIST_ITEMS:
            trimmed[key] = value[:MAX_LIST_ITEMS]
            trimmed[f"{key}_shown_of"] = len(value)
    return trimmed


def build_manifest_excerpt(manifest: dict, relevant_files: list[str]) -> dict:
    files = [_trim_lists(f) for f in manifest["files"] if f["path"] in relevant_files]
    return {
        "entry_file": manifest["entry_file"],
        "files": files,
        "protected_ids": manifest["protected_ids"][:MAX_LIST_ITEMS],
        "protected_classes": manifest["protected_classes"][:MAX_LIST_ITEMS],
        "design_system": manifest["design_system"],
    }


def read_snippets(root: Path, relevant_files: list[str], max_chars: int = 6000, total_max_chars: int = None) -> dict[str, str]:
    """Per-file cap AND a shared budget: ten files at 6000 chars each is a
    60k-char request that no per-minute token allowance will accept."""
    budget = config.LLM_CONTEXT_CHAR_BUDGET if total_max_chars is None else total_max_chars
    snippets = {}
    for rel in relevant_files:
        if budget <= 0:
            break
        path = root / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")[: min(max_chars, budget)]
        snippets[rel] = text
        budget -= len(text)
    return snippets
