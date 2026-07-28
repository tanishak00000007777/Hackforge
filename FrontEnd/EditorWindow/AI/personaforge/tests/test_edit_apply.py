from pathlib import Path

import pytest

from app.edit_apply import apply_html_operation, apply_css_operation, apply_operations, EditApplyError
from app.schemas import EditOperation

HTML = """<html><body><section class="hero"><h1 id="headline">Old</h1></section></body></html>"""
CSS = """:root { --primary-color: #111; }\n.hero { color: red; padding: 10px; }\n"""
TAILWIND_HTML = """<html><body><div class="lg:col-span-5 flex flex-col gap-md z-10"><p>x</p></div></body></html>"""


def op(**kwargs):
    defaults = dict(operation_id="e1", file_path="index.html", reason="test")
    defaults.update(kwargs)
    return EditOperation(**defaults)


def test_set_text():
    result = apply_html_operation(HTML, op(operation="set_text", selector="#headline", new_value="New Headline"), set(), set())
    assert "New Headline" in result
    assert "Old" not in result


def test_set_attribute():
    result = apply_html_operation(HTML, op(operation="set_attribute", selector=".hero", attribute="data-theme", new_value="blue"), set(), set())
    assert 'data-theme="blue"' in result


def test_remove_protected_id_blocked():
    with pytest.raises(EditApplyError):
        apply_html_operation(HTML, op(operation="remove_element", selector="#headline"), {"headline"}, set())


def test_append_child_into_tailwind_colon_selector():
    # the reported bug: selector with Tailwind colon classes (lg:col-span-5)
    # must not crash the selector engine -- it should match and insert.
    result = apply_html_operation(
        TAILWIND_HTML,
        op(operation="append_child", selector=".lg:col-span-5.flex.flex-col.gap-md.z-10",
           content="<h1>Hardik Studio</h1>"),
        set(), set(),
    )
    assert "Hardik Studio" in result


def test_insert_after_with_tailwind_target():
    result = apply_html_operation(
        TAILWIND_HTML,
        op(operation="insert_after", selector=".z-10", content="<h1>Hardik Studio</h1>"),
        set(), set(),
    )
    assert "Hardik Studio" in result


def test_apply_operations_isolates_a_crashing_op(tmp_path):
    # a genuinely malformed selector must become a per-op warning, never crash
    # the whole batch (job would otherwise fail entirely).
    (tmp_path / "index.html").write_text(TAILWIND_HTML, encoding="utf-8")
    ops = [
        op(operation="set_text", file_path="index.html", selector="a:::totally-bad", new_value="x"),
        op(operation="append_child", file_path="index.html", selector=".z-10", content="<h1>Ok</h1>"),
    ]
    changed, warnings = apply_operations(tmp_path, ops, [], [])
    assert changed == ["index.html"]          # the good op still applied
    assert any("totally-bad" in w for w in warnings)
    assert "Ok" in (tmp_path / "index.html").read_text()


def test_missing_selector_raises():
    with pytest.raises(EditApplyError):
        apply_html_operation(HTML, op(operation="set_text", selector="#does-not-exist", new_value="x"), set(), set())


def test_update_css_property_preserves_rest_of_file():
    result = apply_css_operation(CSS, op(operation="update_css_property", selector=".hero", property="color", new_value="blue"))
    assert "color: blue" in result
    assert "padding: 10px" in result
    assert "--primary-color: #111" in result


def test_update_css_variable():
    result = apply_css_operation(CSS, op(operation="update_css_variable", selector=":root", property="--primary-color", new_value="#2255ff"))
    assert "#2255ff" in result


def _assert_var_updated_cleanly(result):
    # the variable is changed IN PLACE inside :root, with no garbage rule
    assert ":root { --primary-color: #2255ff; }" in result
    assert "#111" not in result                 # old value gone
    assert "content:" not in result             # no invented placeholder property
    assert "--primary-color {" not in result    # no bogus selector-named-as-variable rule


def test_var_update_when_model_puts_name_in_selector():
    # the exact broken shape seen in production: var name in 'selector'
    result = apply_css_operation(CSS, op(operation="update_css_variable", selector="--primary-color", new_value="#2255ff"))
    _assert_var_updated_cleanly(result)


def test_var_update_when_model_mislabels_as_create_css_rule():
    result = apply_css_operation(CSS, op(operation="create_css_rule", selector="--primary-color", new_value="#2255ff"))
    _assert_var_updated_cleanly(result)


def test_var_update_when_model_uses_property_field():
    result = apply_css_operation(CSS, op(operation="update_css_property", selector=":root", property="--primary-color", new_value="#2255ff"))
    _assert_var_updated_cleanly(result)


def test_css_property_update_without_property_fails_loudly():
    # a non-variable property edit with no property must warn, not silently
    # manufacture a `content:` rule
    with pytest.raises(EditApplyError):
        apply_css_operation(CSS, op(operation="update_css_property", selector=".hero", new_value="blue"))


def test_apply_operations_end_to_end(tmp_path):
    (tmp_path / "index.html").write_text(HTML, encoding="utf-8")
    (tmp_path / "style.css").write_text(CSS, encoding="utf-8")
    ops = [
        op(operation="set_text", file_path="index.html", selector="#headline", new_value="Hi"),
        op(operation="update_css_property", file_path="style.css", selector=".hero", property="color", new_value="blue"),
        op(operation_id="e2", operation="create_file", file_path="new.txt", content="hello"),
    ]
    changed, warnings = apply_operations(tmp_path, ops, [], [])
    assert set(changed) == {"index.html", "style.css", "new.txt"}
    assert "Hi" in (tmp_path / "index.html").read_text()
    assert "color: blue" in (tmp_path / "style.css").read_text()
    assert warnings == []


def test_apply_operations_records_warning_for_bad_selector(tmp_path):
    (tmp_path / "index.html").write_text(HTML, encoding="utf-8")
    ops = [op(operation="set_text", file_path="index.html", selector="#nope", new_value="Hi")]
    changed, warnings = apply_operations(tmp_path, ops, [], [])
    assert changed == []
    assert len(warnings) == 1


def test_set_text_refuses_to_gut_a_container():
    """The failure that shipped: set_text aimed at a layout wrapper replaced an
    83-line hero with one string."""
    from app.edit_apply import apply_html_operation, EditApplyError
    from app.schemas import EditOperation

    html = '<main class="hero"><h1 id="t">Old</h1><p>Body</p><button>Go</button></main>'
    op = EditOperation(operation_id="1", file_path="index.html", operation="set_text",
                       selector=".hero", new_value="New headline")

    with pytest.raises(EditApplyError, match="Refusing set_text"):
        apply_html_operation(html, op, set(), set())


def test_set_text_still_works_on_a_leaf():
    from app.edit_apply import apply_html_operation
    from app.schemas import EditOperation

    html = '<main class="hero"><h1 id="t">Old</h1></main>'
    op = EditOperation(operation_id="1", file_path="index.html", operation="set_text",
                       selector="#t", new_value="New headline")

    out = apply_html_operation(html, op, set(), set())
    assert "New headline" in out and "<button" not in out


def test_css_operation_on_single_file_site_edits_the_inline_style():
    """Sites with no .css file keep CSS in <style>; a CSS op on the HTML file
    must land there instead of being rejected as unsupported."""
    from app.edit_apply import apply_css_in_html
    from app.schemas import EditOperation

    html = "<html><head><style>:root { --primary: #000000; }</style></head><body><h1>Hi</h1></body></html>"
    op = EditOperation(operation_id="1", file_path="index.html", operation="update_css_variable",
                       property="--primary", new_value="#2563eb")

    out = apply_css_in_html(html, op)
    assert "--primary: #2563eb" in out
    assert "<h1>Hi</h1>" in out


def test_css_operation_creates_a_style_block_when_absent():
    from app.edit_apply import apply_css_in_html
    from app.schemas import EditOperation

    op = EditOperation(operation_id="1", file_path="index.html", operation="create_css_rule",
                       selector=".hero h1", property="font-size", new_value="2.6rem")

    out = apply_css_in_html("<html><head></head><body><h1>Hi</h1></body></html>", op)
    assert "<style>" in out and "font-size: 2.6rem" in out
