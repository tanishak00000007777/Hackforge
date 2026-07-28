import re
from pathlib import Path

import tinycss2
from bs4 import BeautifulSoup

from .schemas import EditOperation
from .security import resolve_within, UploadRejected


class EditApplyError(Exception):
    pass


def _escape_tailwind_colons(selector: str) -> str:
    """Tailwind utility classes contain colons (e.g. lg:col-span-5, hover:bg-x)
    which a CSS selector engine reads as pseudo-classes. In a class/id context
    those colons must be backslash-escaped. Only escape colons that follow a
    class/word char (Tailwind variants), leaving real pseudo-classes like
    ':hover', ':root', '::before', and already-escaped '\\:' untouched."""
    return re.sub(r"(?<=[\w-])(?<!\\):(?=[\w-])", r"\\:", selector)


def _safe_select(soup: BeautifulSoup, selector: str, one: bool = False):
    """soup.select with a Tailwind-colon fallback. A malformed selector raises
    EditApplyError so it degrades to a per-op warning, never a job crash."""
    fn = soup.select_one if one else soup.select
    try:
        return fn(selector)
    except Exception:
        try:
            return fn(_escape_tailwind_colons(selector))
        except Exception as exc:
            raise EditApplyError(f"Invalid selector {selector!r}: {exc}") from exc


def _html_op(soup: BeautifulSoup, op: EditOperation, protected_ids: set[str], protected_classes: set[str]) -> str:
    matches = _safe_select(soup, op.selector) if op.selector else []

    if op.operation in ("insert_before", "insert_after", "append_child"):
        target_selector = op.target_selector or op.selector
        matches = _safe_select(soup, target_selector) if target_selector else []

    if op.operation != "create_file" and not matches:
        raise EditApplyError(f"Selector matched no elements: {op.selector}")
    if op.operation in ("insert_before", "insert_after", "append_child", "set_inner_html") and not (op.content or "").strip():
        # Without content these silently do nothing (or, for set_inner_html,
        # empty the element) while still marking the file as changed.
        raise EditApplyError(f"{op.operation} requires 'content' holding the markup to insert")
    if op.operation not in ("remove_element",) and len(matches) > 1:
        # deterministic and conservative: only ever touch the first match,
        # never silently fan out an edit across unexpected duplicates.
        matches = matches[:1]

    for tag in matches:
        tag_id = tag.get("id")
        tag_classes = set(tag.get("class", []))
        if op.operation in ("remove_element",) and tag_id and tag_id in protected_ids:
            raise EditApplyError(f"Refusing to remove protected id #{tag_id}")
        if op.operation == "remove_class" and op.new_value in protected_classes:
            raise EditApplyError(f"Refusing to remove protected class .{op.new_value}")

        if op.operation == "set_text":
            # tag.string on a container silently deletes its entire subtree.
            # Models aim set_text at layout wrappers often enough that this
            # must be refused, not trusted (section 10: reject ambiguous
            # destructive operations).
            nested = tag.find_all(True)
            if nested:
                raise EditApplyError(
                    f"Refusing set_text on <{tag.name}> holding {len(nested)} child element(s); "
                    "it would delete them. To CHANGE existing text, target the element that "
                    "directly holds it (e.g. the <h1> inside). To ADD something new, use "
                    "insert_after/append_child with the markup in 'content'."
                )
            tag.string = op.new_value or ""
        elif op.operation == "set_inner_html":
            new_fragment = BeautifulSoup(op.content or "", "lxml")
            body = new_fragment.body or new_fragment
            tag.clear()
            for child in list(body.contents):
                tag.append(child)
        elif op.operation == "set_attribute":
            if not op.attribute:
                raise EditApplyError("set_attribute requires 'attribute'")
            tag[op.attribute] = op.new_value or ""
        elif op.operation == "remove_attribute":
            if not op.attribute:
                raise EditApplyError("remove_attribute requires 'attribute'")
            if op.attribute == "id" and tag_id in protected_ids:
                raise EditApplyError(f"Refusing to remove protected id attribute on #{tag_id}")
            tag.attrs.pop(op.attribute, None)
        elif op.operation == "add_class":
            classes = tag.get("class", [])
            if op.new_value and op.new_value not in classes:
                classes.append(op.new_value)
            tag["class"] = classes
        elif op.operation == "remove_class":
            classes = tag.get("class", [])
            tag["class"] = [c for c in classes if c != op.new_value]
        elif op.operation == "insert_before":
            fragment = BeautifulSoup(op.content or "", "lxml")
            for child in list((fragment.body or fragment).contents):
                tag.insert_before(child)
        elif op.operation == "insert_after":
            fragment = BeautifulSoup(op.content or "", "lxml")
            for child in reversed(list((fragment.body or fragment).contents)):
                tag.insert_after(child)
        elif op.operation == "append_child":
            fragment = BeautifulSoup(op.content or "", "lxml")
            for child in list((fragment.body or fragment).contents):
                tag.append(child)
        elif op.operation == "remove_element":
            tag.decompose()
        elif op.operation == "move_element":
            if not op.target_selector:
                raise EditApplyError("move_element requires 'target_selector'")
            dest = _safe_select(soup, op.target_selector, one=True)
            if not dest:
                raise EditApplyError(f"move_element target not found: {op.target_selector}")
            dest.append(tag.extract())
        else:
            raise EditApplyError(f"Unsupported HTML operation: {op.operation}")

    return str(soup)


def apply_html_operation(html_text: str, op: EditOperation, protected_ids: set[str], protected_classes: set[str]) -> str:
    soup = BeautifulSoup(html_text, "lxml")
    return _html_op(soup, op, protected_ids, protected_classes)


CSS_OPERATIONS = {"update_css_property", "create_css_rule", "update_css_variable"}


def apply_css_in_html(html_text: str, op: EditOperation) -> str:
    """Single-file sites keep their CSS in an inline <style> block, so a CSS
    operation aimed at an .html file is correct, not a mistake. Edit that block
    (creating one in <head> when the page has none)."""
    soup = BeautifulSoup(html_text, "lxml")
    style = soup.find("style")
    if style is None:
        head = soup.head or soup.find("html") or soup
        style = soup.new_tag("style")
        head.append(style)
    style.string = apply_css_operation(style.get_text() or "", op)
    return str(soup)


def _find_rule(rules: list, selector: str):
    target = selector.strip()
    for rule in rules:
        if getattr(rule, "type", None) == "qualified-rule":
            if tinycss2.serialize(rule.prelude).strip() == target:
                return rule
    return None


def _extract_var_name(op: EditOperation) -> str | None:
    """The model inconsistently puts a CSS custom-property name (--foo) in
    either 'property' or 'selector'. Find it wherever it is."""
    for candidate in (op.property, op.selector):
        if candidate and candidate.strip().startswith("--") and " " not in candidate.strip():
            return candidate.strip()
    return None


def _set_decl_in_rule(css_text: str, rule, prop_name: str, new_value: str) -> str:
    """Update prop_name inside an existing rule in place (add it if absent)."""
    original = tinycss2.serialize([rule])
    decls = tinycss2.parse_declaration_list(rule.content, skip_comments=False, skip_whitespace=False)
    new_value_tokens = tinycss2.parse_component_value_list(f" {new_value}")
    found = False
    for decl in decls:
        if getattr(decl, "type", None) == "declaration" and decl.lower_name == prop_name.lower():
            decl.value = new_value_tokens
            found = True
            break
    if not found:
        decls = decls + tinycss2.parse_declaration_list(f" {prop_name}: {new_value};", skip_comments=False, skip_whitespace=False)
    rule.content = decls
    return css_text.replace(original, tinycss2.serialize([rule]), 1)


def _update_css_variable(css_text: str, var_name: str, new_value: str) -> str:
    """Update a CSS custom property wherever it is declared; if it is not
    declared anywhere, add it to :root (creating :root if needed). This is the
    single deterministic path for every theme/colour edit."""
    rules = tinycss2.parse_stylesheet(css_text, skip_comments=False, skip_whitespace=False)
    for rule in rules:
        if getattr(rule, "type", None) != "qualified-rule":
            continue
        decls = tinycss2.parse_declaration_list(rule.content, skip_comments=False, skip_whitespace=False)
        if any(getattr(d, "type", None) == "declaration" and d.lower_name == var_name.lower() for d in decls):
            return _set_decl_in_rule(css_text, rule, var_name, new_value)

    root = _find_rule(rules, ":root")
    if root is not None:
        return _set_decl_in_rule(css_text, root, var_name, new_value)
    return css_text + f"\n\n:root {{\n  {var_name}: {new_value};\n}}\n"


def apply_css_operation(css_text: str, op: EditOperation) -> str:
    if not op.new_value:
        raise EditApplyError(f"{op.operation} on {op.selector or op.property} requires 'new_value'")

    # Any edit that names a CSS variable -- regardless of how the model labelled
    # the operation or which field holds the --name -- updates that variable in
    # place. One rule change recolours everything that references it.
    var_name = _extract_var_name(op)
    if var_name:
        return _update_css_variable(css_text, var_name, op.new_value)

    if not op.property:
        raise EditApplyError(f"{op.operation} on {op.selector} requires 'property'")
    selector = op.selector or ":root"

    if op.operation == "create_css_rule":
        return css_text + f"\n\n{selector} {{\n  {op.property}: {op.new_value};\n}}\n"

    rules = tinycss2.parse_stylesheet(css_text, skip_comments=False, skip_whitespace=False)
    rule = _find_rule(rules, selector)
    if rule is None:
        # target rule doesn't exist yet: create it with the real property
        # (never invent a placeholder like `content:`).
        return css_text + f"\n\n{selector} {{\n  {op.property}: {op.new_value};\n}}\n"

    return _set_decl_in_rule(css_text, rule, op.property, op.new_value)


def apply_operations(
    root: Path,
    operations: list[EditOperation],
    protected_ids: list[str],
    protected_classes: list[str],
) -> tuple[list[str], list[str]]:
    """Apply operations to files under root. Returns (changed_files, warnings).
    Unsafe/ambiguous operations are skipped and recorded as warnings rather
    than aborting the whole batch (section 10: 'ambiguous destructive
    operations must be rejected', not the entire job)."""
    protected_ids_set = set(protected_ids)
    protected_classes_set = set(protected_classes)
    changed_files: set[str] = set()
    warnings: list[str] = []

    file_cache: dict[str, str] = {}

    for op in operations:
        try:
            target = resolve_within(root, op.file_path)
        except UploadRejected as exc:
            warnings.append(f"{op.operation_id}: {exc}")
            continue

        if op.operation == "create_file":
            if target.exists():
                warnings.append(f"{op.operation_id}: create_file refused, file already exists: {op.file_path}")
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(op.content or "", encoding="utf-8")
            changed_files.add(op.file_path)
            continue

        if not target.exists():
            warnings.append(f"{op.operation_id}: file does not exist: {op.file_path}")
            continue

        ext = target.suffix.lower()
        text = file_cache.get(op.file_path, target.read_text(encoding="utf-8", errors="replace"))

        try:
            if ext in (".html", ".htm"):
                if op.operation in CSS_OPERATIONS:
                    text = apply_css_in_html(text, op)
                else:
                    text = apply_html_operation(text, op, protected_ids_set, protected_classes_set)
            elif ext == ".css":
                text = apply_css_operation(text, op)
            else:
                warnings.append(f"{op.operation_id}: unsupported file type for editing: {op.file_path}")
                continue
        except EditApplyError as exc:
            warnings.append(f"{op.operation_id}: {exc}")
            continue
        except Exception as exc:
            # Never let one malformed model operation crash the whole job --
            # isolate it as a warning surfaced in the review UI. The op id and
            # error type keep it debuggable.
            warnings.append(f"{op.operation_id}: skipped ({type(exc).__name__}: {exc})")
            continue

        file_cache[op.file_path] = text
        changed_files.add(op.file_path)

    for rel, text in file_cache.items():
        (root / rel).write_text(text, encoding="utf-8")

    return sorted(changed_files), warnings
