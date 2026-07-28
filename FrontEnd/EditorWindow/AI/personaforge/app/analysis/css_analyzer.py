import re
from pathlib import Path

import tinycss2

COLOR_PATTERN = re.compile(r"#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]+\)|\bhsla?\([^)]+\)")


def analyze_css(path: Path, rel_path: str) -> dict:
    css = path.read_text(encoding="utf-8", errors="replace")
    rules = tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True)

    variables: dict[str, str] = {}
    selectors: list[str] = []
    colors: set[str] = set()
    font_families: set[str] = set()
    font_sizes: set[str] = set()
    spacing_values: set[str] = set()
    border_radii: set[str] = set()
    shadows: set[str] = set()
    media_queries: list[str] = []
    animations: set[str] = set()

    def walk(rule_list):
        for rule in rule_list:
            if rule.type == "qualified-rule":
                selector = tinycss2.serialize(rule.prelude).strip()
                selectors.append(selector)
                decls = tinycss2.parse_declaration_list(rule.content, skip_comments=True, skip_whitespace=True)
                for decl in decls:
                    if decl.type != "declaration":
                        continue
                    prop = decl.lower_name
                    value = tinycss2.serialize(decl.value).strip()
                    if prop.startswith("--"):
                        variables[prop] = value
                    if prop == "color" or "color" in prop:
                        colors.update(COLOR_PATTERN.findall(value))
                    if prop == "font-family":
                        font_families.add(value)
                    if prop == "font-size":
                        font_sizes.add(value)
                    if prop in ("margin", "padding") or prop.startswith(("margin-", "padding-")):
                        spacing_values.add(value)
                    if prop == "border-radius":
                        border_radii.add(value)
                    if prop == "box-shadow":
                        shadows.add(value)
                    if prop == "animation" or prop == "animation-name":
                        animations.add(value)
                    colors.update(COLOR_PATTERN.findall(value))
            elif rule.type == "at-rule":
                if rule.lower_at_keyword == "media" and rule.prelude:
                    media_queries.append(tinycss2.serialize(rule.prelude).strip())
                if rule.content:
                    walk(tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True))

    walk(rules)

    return {
        "path": rel_path,
        "type": "css",
        "variables": variables,
        "selectors": selectors,
        "colors": sorted(colors),
        "font_families": sorted(font_families),
        "font_sizes": sorted(font_sizes),
        "spacing_values": sorted(spacing_values),
        "border_radii": sorted(border_radii),
        "shadows": sorted(shadows),
        "media_queries": media_queries,
        "animations": sorted(animations),
    }
