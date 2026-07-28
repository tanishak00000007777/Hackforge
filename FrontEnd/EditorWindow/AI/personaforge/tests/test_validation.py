from app.validation import validate_html_file, validate_css_file, validate_workspace


def test_validate_html_flags_duplicate_ids(tmp_path):
    (tmp_path / "index.html").write_text(
        '<html><body><div id="a">1</div><div id="a">2</div></body></html>', encoding="utf-8"
    )
    errors = validate_html_file(tmp_path, "index.html", None, None)
    assert any("duplicate" in e.lower() for e in errors)


def test_validate_html_flags_missing_asset(tmp_path):
    (tmp_path / "index.html").write_text(
        '<html><body><img src="missing.png"></body></html>', encoding="utf-8"
    )
    errors = validate_html_file(tmp_path, "index.html", None, None)
    assert any("missing local asset" in e for e in errors)


def test_validate_html_flags_removed_protected_id(tmp_path):
    (tmp_path / "index.html").write_text('<html><body><div>no ids</div></body></html>', encoding="utf-8")
    errors = validate_html_file(tmp_path, "index.html", {"menu-toggle"}, set())
    assert any("removed protected IDs" in e for e in errors)


def test_validate_workspace_does_not_flag_project_wide_protected_id_absent_from_this_file(tmp_path):
    # menu-toggle is a JS hook (protected project-wide) but was never an
    # actual id in index.html -- removing it from index.html isn't a
    # regression and must not fail validation.
    (tmp_path / "index.html").write_text('<html><body><div id="other">hi</div></body></html>', encoding="utf-8")
    manifest = {
        "protected_ids": ["menu-toggle"],
        "protected_classes": [],
        "files": [{"path": "index.html", "type": "html", "ids": ["other"], "classes": []}],
    }
    result = validate_workspace(tmp_path, manifest, allow_js_changes=False)
    assert result["passed"] is True


def test_validate_workspace_flags_id_removed_from_the_file_that_had_it(tmp_path):
    (tmp_path / "index.html").write_text('<html><body><div>gone</div></body></html>', encoding="utf-8")
    manifest = {
        "protected_ids": ["menu-toggle"],
        "protected_classes": [],
        "files": [{"path": "index.html", "type": "html", "ids": ["menu-toggle"], "classes": []}],
    }
    result = validate_workspace(tmp_path, manifest, allow_js_changes=False)
    assert result["passed"] is False
    assert any("menu-toggle" in e for e in result["errors"])


def test_validate_css_flags_unmatched_braces(tmp_path):
    (tmp_path / "style.css").write_text(".hero { color: red;", encoding="utf-8")
    errors = validate_css_file(tmp_path, "style.css")
    assert any("unmatched braces" in e for e in errors)


def test_validate_css_passes_clean_file(tmp_path):
    (tmp_path / "style.css").write_text(".hero { color: red; }", encoding="utf-8")
    errors = validate_css_file(tmp_path, "style.css")
    assert errors == []
