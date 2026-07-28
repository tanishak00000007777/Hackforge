import zipfile
from pathlib import Path

import pytest

from app.security import extract_zip, safe_relpath, resolve_within, UploadRejected


def test_safe_relpath_rejects_traversal():
    with pytest.raises(UploadRejected):
        safe_relpath("../../etc/passwd")


def test_safe_relpath_rejects_absolute():
    with pytest.raises(UploadRejected):
        safe_relpath("/etc/passwd")
    with pytest.raises(UploadRejected):
        safe_relpath("C:/Windows/system32")


def test_safe_relpath_normalizes():
    assert safe_relpath("./css/./style.css") == "css/style.css"


def test_extract_zip_blocks_zip_slip(tmp_path):
    zip_path = tmp_path / "evil.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("../outside.html", "<html></html>")
    with pytest.raises(UploadRejected):
        extract_zip(zip_path, tmp_path / "dest")


def test_extract_zip_blocks_executables(tmp_path):
    zip_path = tmp_path / "evil.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("payload.exe", b"MZ")
    with pytest.raises(UploadRejected):
        extract_zip(zip_path, tmp_path / "dest")


def test_extract_zip_happy_path(tmp_path):
    zip_path = tmp_path / "site.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("index.html", "<html><body>Hi</body></html>")
        zf.writestr("css/style.css", "body { color: red; }")
    dest = tmp_path / "dest"
    extracted = extract_zip(zip_path, dest)
    assert "index.html" in extracted
    assert "css/style.css" in extracted
    assert (dest / "index.html").exists()


def test_resolve_within_blocks_escape(tmp_path):
    base = tmp_path / "workspace"
    base.mkdir()
    with pytest.raises(UploadRejected):
        resolve_within(base, "../../secret.txt")
