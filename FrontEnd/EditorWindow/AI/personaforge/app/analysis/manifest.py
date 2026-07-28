from pathlib import Path

from .. import storage
from .html_analyzer import analyze_html
from .css_analyzer import analyze_css
from .js_analyzer import analyze_js


def build_manifest(root: Path, files: list[str], project_id: str, project_name: str) -> dict:
    entry_file = storage.detect_entry_file(root, files)

    file_entries = []
    protected_ids: set[str] = set()
    protected_classes: set[str] = set()
    css_variables: dict[str, str] = {}
    colors: set[str] = set()
    fonts: set[str] = set()
    spacing_values: set[str] = set()
    border_radii: set[str] = set()

    for rel in sorted(files):
        ext = Path(rel).suffix.lower()
        abs_path = root / rel
        if ext in (".html", ".htm"):
            entry = analyze_html(abs_path, rel)
            file_entries.append(entry)
        elif ext == ".css":
            entry = analyze_css(abs_path, rel)
            file_entries.append(entry)
            css_variables.update(entry["variables"])
            colors.update(entry["colors"])
            fonts.update(entry["font_families"])
            spacing_values.update(entry["spacing_values"])
            border_radii.update(entry["border_radii"])
        elif ext == ".js":
            entry = analyze_js(abs_path, rel)
            file_entries.append(entry)
            protected_ids.update(entry["protected_ids"])
            protected_classes.update(entry["protected_classes"])
        else:
            file_entries.append({"path": rel, "type": ext.lstrip(".") or "asset"})

    pages = [f["path"] for f in file_entries if f["type"] == "html"]
    components = [c for f in file_entries if f["type"] == "html" for c in f.get("components", [])]

    return {
        "project_id": project_id,
        "project_name": project_name,
        "entry_file": entry_file,
        "files": file_entries,
        "pages": pages,
        "components": components,
        "protected_ids": sorted(protected_ids),
        "protected_classes": sorted(protected_classes),
        "design_system": {
            "css_variables": css_variables,
            "fonts": sorted(fonts),
            "primary_colours": sorted(colors)[:20],
            "spacing_values": sorted(spacing_values),
            "border_radii": sorted(border_radii),
        },
    }
