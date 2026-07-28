import re
from pathlib import Path

from bs4 import BeautifulSoup

# component keyword -> id/class/tag hints, checked in order (section 4.2)
COMPONENT_KEYWORDS = {
    "navbar": ["nav", "navbar", "menu", "header-nav"],
    "hero": ["hero", "banner", "jumbotron"],
    "features": ["features", "feature-list"],
    "services": ["services", "service-list"],
    "pricing": ["pricing", "price-table", "plans"],
    "testimonials": ["testimonials", "reviews", "quotes"],
    "team": ["team", "our-team"],
    "portfolio": ["portfolio", "work"],
    "projects": ["projects", "project-list"],
    "faq": ["faq", "accordion"],
    "contact": ["contact", "contact-form", "contact-us"],
    "footer": ["footer"],
    "sidebar": ["sidebar", "aside-nav"],
    "dashboard": ["dashboard"],
    "gallery": ["gallery", "lightbox"],
    "auth": ["login", "signup", "register", "auth"],
}


def _matches_keyword(tag, keywords: list[str]) -> bool:
    haystack = " ".join(filter(None, [
        tag.get("id", ""),
        " ".join(tag.get("class", [])),
        tag.name,
    ])).lower()
    return any(kw in haystack for kw in keywords)


def detect_components(soup: BeautifulSoup, file_key: str) -> list[dict]:
    found = []
    seen_ids = set()
    candidates = soup.find_all(["section", "div", "nav", "header", "footer", "aside", "form", "table", "main"])
    for tag in candidates:
        for component, keywords in COMPONENT_KEYWORDS.items():
            if _matches_keyword(tag, keywords):
                comp_id = tag.get("id") or f"{component}"
                key = f"{file_key}.{component}"
                if key in seen_ids:
                    continue
                seen_ids.add(key)
                found.append({
                    "key": key,
                    "type": component,
                    "selector": f"#{comp_id}" if tag.get("id") else _class_selector(tag),
                    "tag": tag.name,
                })
                break
    if soup.find_all("div", class_=re.compile(r"card", re.I)):
        key = f"{file_key}.cards"
        if key not in seen_ids:
            found.append({"key": key, "type": "cards", "selector": ".card", "tag": "div"})
    return found


def _class_selector(tag) -> str:
    classes = tag.get("class")
    if classes:
        return "." + ".".join(classes)
    return tag.name


def analyze_html(path: Path, rel_path: str) -> dict:
    html = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(html, "lxml")
    file_key = Path(rel_path).stem or "index"

    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_desc_tag.get("content", "") if meta_desc_tag else ""

    headings = [h.get_text(strip=True) for h in soup.find_all(re.compile(r"^h[1-6]$"))]
    paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    buttons = [b.get_text(strip=True) for b in soup.find_all(["button"]) + soup.find_all("a", class_=re.compile(r"btn", re.I))]
    links = [a.get("href") for a in soup.find_all("a", href=True)]
    nav_items = [a.get_text(strip=True) for nav in soup.find_all("nav") for a in nav.find_all("a")]

    forms = []
    for form in soup.find_all("form"):
        inputs = [{"name": i.get("name"), "type": i.get("type", "text"), "id": i.get("id")} for i in form.find_all(["input", "textarea", "select"])]
        forms.append({"id": form.get("id"), "action": form.get("action"), "inputs": inputs})

    ids = [t.get("id") for t in soup.find_all(id=True)]
    classes = sorted({c for t in soup.find_all(class_=True) for c in t.get("class", [])})

    images = [{"src": img.get("src"), "alt": img.get("alt", "")} for img in soup.find_all("img")]

    stylesheets = [l.get("href") for l in soup.find_all("link", rel="stylesheet") if l.get("href")]
    scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]
    inline_styles = [t.get("style") for t in soup.find_all(style=True)]
    inline_scripts = [s.get_text() for s in soup.find_all("script") if not s.get("src") and s.get_text(strip=True)]

    internal_links = [
        href for href in links
        if href and not href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:"))
    ]

    components = detect_components(soup, file_key)

    return {
        "path": rel_path,
        "type": "html",
        "title": title,
        "meta_description": meta_description,
        "headings": headings,
        "paragraphs": paragraphs[:50],
        "buttons": buttons,
        "links": links,
        "nav_items": nav_items,
        "forms": forms,
        "ids": [i for i in ids if i],
        "classes": classes,
        "images": images,
        "stylesheets": stylesheets,
        "scripts": scripts,
        "inline_styles": inline_styles,
        "inline_scripts": inline_scripts,
        "internal_links": internal_links,
        "components": components,
    }
