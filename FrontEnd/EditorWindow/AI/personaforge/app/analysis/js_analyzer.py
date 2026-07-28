import re
from pathlib import Path

# ponytail: regex extraction instead of a Tree-sitter AST, upgrade to Tree-sitter
# if false positives/negatives on protected-ID detection start causing real edits
# to break JS hooks.
GET_ELEMENT_BY_ID = re.compile(r"getElementById\(\s*['\"]([^'\"]+)['\"]\s*\)")
QUERY_SELECTOR = re.compile(r"querySelector\(\s*['\"]([^'\"]+)['\"]\s*\)")
QUERY_SELECTOR_ALL = re.compile(r"querySelectorAll\(\s*['\"]([^'\"]+)['\"]\s*\)")
ADD_EVENT_LISTENER = re.compile(r"addEventListener\(\s*['\"]([^'\"]+)['\"]")
LOCAL_IMPORT = re.compile(r"""(?:import\s+.*?from\s+|require\()\s*['"](\.[^'"]+)['"]""")

MENU_HINTS = re.compile(r"menu|toggle|hamburger", re.I)
MODAL_HINTS = re.compile(r"modal|dialog|popup", re.I)
TAB_HINTS = re.compile(r"tab", re.I)


def _selector_to_id_or_class(selectors: list[str]) -> tuple[list[str], list[str]]:
    ids, classes = [], []
    for sel in selectors:
        for token in re.findall(r"[#.][\w-]+", sel):
            if token.startswith("#"):
                ids.append(token[1:])
            else:
                classes.append(token[1:])
    return ids, classes


def analyze_js(path: Path, rel_path: str) -> dict:
    js = path.read_text(encoding="utf-8", errors="replace")

    ids_by_getid = GET_ELEMENT_BY_ID.findall(js)
    qs = QUERY_SELECTOR.findall(js)
    qsa = QUERY_SELECTOR_ALL.findall(js)
    qs_ids, qs_classes = _selector_to_id_or_class(qs + qsa)

    events = ADD_EVENT_LISTENER.findall(js)
    imports = LOCAL_IMPORT.findall(js)

    menu_toggles = [s for s in (qs + qsa + ids_by_getid) if MENU_HINTS.search(s)]
    modal_triggers = [s for s in (qs + qsa + ids_by_getid) if MODAL_HINTS.search(s)]
    tab_selectors = [s for s in (qs + qsa + ids_by_getid) if TAB_HINTS.search(s)]

    protected_ids = sorted(set(ids_by_getid + qs_ids))
    protected_classes = sorted(set(qs_classes))

    return {
        "path": rel_path,
        "type": "js",
        "get_element_by_id": sorted(set(ids_by_getid)),
        "query_selector": sorted(set(qs)),
        "query_selector_all": sorted(set(qsa)),
        "event_listeners": sorted(set(events)),
        "local_imports": imports,
        "menu_toggles": menu_toggles,
        "modal_triggers": modal_triggers,
        "tab_selectors": tab_selectors,
        "protected_ids": protected_ids,
        "protected_classes": protected_classes,
    }
