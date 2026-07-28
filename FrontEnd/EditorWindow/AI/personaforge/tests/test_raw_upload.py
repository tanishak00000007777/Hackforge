import pytest

from app.security import write_uploaded_files, UploadRejected


def test_write_uploaded_files_happy_path(tmp_path):
    files = [
        ("index.html", b"<html></html>"),
        ("css/style.css", b"body { color: red; }"),
        ("js/app.js", b"console.log(1)"),
    ]
    written = write_uploaded_files(files, tmp_path / "dest")
    assert set(written) == {"index.html", "css/style.css", "js/app.js"}
    assert (tmp_path / "dest" / "css" / "style.css").exists()


def test_write_uploaded_files_blocks_traversal(tmp_path):
    with pytest.raises(UploadRejected):
        write_uploaded_files([("../evil.html", b"x")], tmp_path / "dest")


def test_write_uploaded_files_blocks_executables(tmp_path):
    with pytest.raises(UploadRejected):
        write_uploaded_files([("payload.exe", b"MZ")], tmp_path / "dest")


def test_write_uploaded_files_skips_unknown_extensions(tmp_path):
    written = write_uploaded_files(
        [("index.html", b"<html></html>"), ("notes.docx", b"binary")], tmp_path / "dest"
    )
    assert written == ["index.html"]
