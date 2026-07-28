from pathlib import Path

from app.analysis.html_analyzer import analyze_html
from app.analysis.css_analyzer import analyze_css
from app.analysis.js_analyzer import analyze_js
from app.analysis.manifest import build_manifest

SAMPLE_HTML = """<!doctype html>
<html><head><title>Home</title>
<link rel="stylesheet" href="css/style.css">
<script src="js/app.js"></script>
</head>
<body>
<nav id="navbar"><a href="index.html">Home</a><a href="about.html">About</a></nav>
<section class="hero"><h1>Welcome</h1><p>Build things.</p></section>
<section id="pricing"><div class="card">Basic</div><div class="card">Pro</div></section>
<form id="contact-form"><input name="email" type="email"></form>
<footer>copyright</footer>
</body></html>
"""

SAMPLE_CSS = """
:root { --primary-color: #1155ff; }
.hero { color: var(--primary-color); padding: 20px; border-radius: 8px; }
.btn { box-shadow: 0 1px 2px rgba(0,0,0,.2); }
@media (max-width: 600px) { .hero { padding: 10px; } }
"""

SAMPLE_JS = """
document.getElementById('menu-toggle').addEventListener('click', function () {
  document.querySelector('.nav-menu').classList.toggle('open');
});
document.querySelectorAll('.tab-item').forEach(t => {});
"""


def test_analyze_html_extracts_components_and_links(tmp_path):
    p = tmp_path / "index.html"
    p.write_text(SAMPLE_HTML, encoding="utf-8")
    result = analyze_html(p, "index.html")
    assert result["title"] == "Home"
    assert "about.html" in result["internal_links"]
    component_types = {c["type"] for c in result["components"]}
    assert "navbar" in component_types
    assert "hero" in component_types
    assert "pricing" in component_types
    assert result["forms"][0]["id"] == "contact-form"


def test_analyze_css_extracts_variables_and_media(tmp_path):
    p = tmp_path / "style.css"
    p.write_text(SAMPLE_CSS, encoding="utf-8")
    result = analyze_css(p, "style.css")
    assert result["variables"]["--primary-color"] == "#1155ff"
    assert "8px" in result["border_radii"]
    assert result["media_queries"]


def test_analyze_js_finds_protected_hooks(tmp_path):
    p = tmp_path / "app.js"
    p.write_text(SAMPLE_JS, encoding="utf-8")
    result = analyze_js(p, "app.js")
    assert "menu-toggle" in result["protected_ids"]
    assert "nav-menu" in result["protected_classes"]
    assert result["menu_toggles"]


def test_build_manifest_detects_entry_file(tmp_path):
    (tmp_path / "css").mkdir()
    (tmp_path / "js").mkdir()
    (tmp_path / "index.html").write_text(SAMPLE_HTML, encoding="utf-8")
    (tmp_path / "css" / "style.css").write_text(SAMPLE_CSS, encoding="utf-8")
    (tmp_path / "js" / "app.js").write_text(SAMPLE_JS, encoding="utf-8")

    files = ["index.html", "css/style.css", "js/app.js"]
    manifest = build_manifest(tmp_path, files, "proj1", "Demo")
    assert manifest["entry_file"] == "index.html"
    assert "menu-toggle" in manifest["protected_ids"]
    assert manifest["design_system"]["css_variables"]["--primary-color"] == "#1155ff"


def test_context_is_bounded_for_the_model():
    """A request bigger than the model's allowance is a hard 413, so both the
    manifest excerpt and the snippet set must be capped."""
    import json
    from app.retrieval import build_manifest_excerpt, read_snippets, MAX_LIST_ITEMS

    manifest = {
        "entry_file": "index.html",
        "files": [{"path": "index.html", "type": "html",
                   "classes": [f"c{i}" for i in range(2000)],
                   "ids": [f"i{i}" for i in range(500)]}],
        "protected_ids": [f"p{i}" for i in range(300)],
        "protected_classes": [],
        "design_system": {},
    }
    excerpt = build_manifest_excerpt(manifest, ["index.html"])
    assert len(excerpt["files"][0]["classes"]) == MAX_LIST_ITEMS
    assert excerpt["files"][0]["classes_shown_of"] == 2000
    assert len(excerpt["protected_ids"]) == MAX_LIST_ITEMS
    assert len(json.dumps(excerpt)) < 8000


def test_snippets_share_one_budget(tmp_path):
    from app.retrieval import read_snippets

    for i in range(10):
        (tmp_path / f"f{i}.html").write_text("x" * 6000, encoding="utf-8")
    names = [f"f{i}.html" for i in range(10)]

    snippets = read_snippets(tmp_path, names, total_max_chars=12000)
    assert sum(len(v) for v in snippets.values()) <= 12000


def test_selector_menu_only_offers_selectors_that_resolve():
    """Every invented-selector failure traced back to the model guessing. The
    menu must contain only selectors that actually match, exactly once."""
    from bs4 import BeautifulSoup
    from app.retrieval import selector_menu

    html = """<html><body>
      <nav class="fixed px-4"><a class="brand" href="#">Home</a></nav>
      <main class="relative pt-32">
        <h1 id="headline" class="lg:text-4xl">Old Headline</h1>
        <p class="text-body">Body copy</p>
        <button class="bg-primary">Go</button>
      </main></body></html>"""

    menu = selector_menu(html)
    soup = BeautifulSoup(html, "lxml")
    assert menu, "menu must not be empty for a normal page"
    for item in menu:
        assert len(soup.select(item["selector"])) == 1, item["selector"]

    by_selector = {m["selector"]: m for m in menu}
    assert "#headline" in by_selector, "an id must win over classes"
    assert by_selector["#headline"]["holds_text"] is True
    assert by_selector["#headline"]["text"] == "Old Headline"
    assert by_selector["main.relative"]["holds_text"] is False, "wrappers must be flagged unsafe for set_text"
    assert not any(":" in s or "[" in s for s in by_selector), "no tailwind variant classes"


def test_selector_menu_skips_non_html():
    from app.retrieval import build_selector_menus

    menus = build_selector_menus({"index.html": "<h1 id='a'>Hi</h1>", "style.css": ".a { color: red; }"})
    assert set(menus) == {"index.html"}
