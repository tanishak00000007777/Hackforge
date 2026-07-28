import os
import zipfile
from pathlib import Path

from . import config


class UploadRejected(Exception):
    pass


def safe_relpath(name: str) -> str:
    """Reject absolute paths, '..' traversal, and normalize separators."""
    normalized = name.replace("\\", "/")
    if normalized.startswith("/") or (len(normalized) > 1 and normalized[1] == ":"):
        raise UploadRejected(f"Absolute path not allowed: {name}")
    parts = [p for p in normalized.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts):
        raise UploadRejected(f"Path traversal not allowed: {name}")
    return "/".join(parts)


def _check_and_target(rel_name: str, size: int, dest_dir: Path, file_count: int, total_bytes: int) -> tuple[str, Path] | None:
    """Shared per-file validation for both ZIP entries and raw uploaded files.
    Returns (rel_path, target_path) or None if the file should be silently
    skipped (unknown extension)."""
    rel = safe_relpath(rel_name)
    if not rel:
        return None

    ext = Path(rel).suffix.lower()
    if ext in config.BLOCKED_EXTENSIONS:
        raise UploadRejected(f"Executable/unsupported file type rejected: {rel}")
    if ext and ext not in config.SUPPORTED_EXTENSIONS:
        return None

    if file_count + 1 > config.MAX_FILE_COUNT:
        raise UploadRejected("Maximum file count exceeded")
    if total_bytes + size > config.MAX_EXTRACTED_BYTES:
        raise UploadRejected("Extracted project size limit exceeded")

    target = (dest_dir / rel).resolve()
    if not str(target).startswith(str(dest_dir.resolve())):
        raise UploadRejected(f"Path escapes workspace: {rel}")
    return rel, target


def extract_zip(zip_path: Path, dest_dir: Path) -> list[str]:
    """Safely extract a ZIP into dest_dir. Returns list of extracted relative paths."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    extracted: list[str] = []
    total_bytes = 0

    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue

            # reject symlinks (unix mode bits stored in external_attr high 16 bits)
            mode = info.external_attr >> 16
            import stat as _stat
            if mode and _stat.S_ISLNK(mode):
                raise UploadRejected(f"Symbolic links not allowed: {info.filename}")

            result = _check_and_target(info.filename, info.file_size, dest_dir, len(extracted), total_bytes)
            if result is None:
                continue
            rel, target = result
            total_bytes += info.file_size

            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as src, open(target, "wb") as out:
                out.write(src.read())
            extracted.append(rel)

    if not extracted:
        raise UploadRejected("ZIP contained no supported files")
    return extracted


def write_uploaded_files(files: list[tuple[str, bytes]], dest_dir: Path) -> list[str]:
    """Safely write a flat list of (relative_path, content) pairs into
    dest_dir -- the non-ZIP equivalent of extract_zip, used when the browser
    uploads a folder's files directly instead of a ZIP archive."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    total_bytes = 0

    for name, content in files:
        result = _check_and_target(name, len(content), dest_dir, len(written), total_bytes)
        if result is None:
            continue
        rel, target = result
        total_bytes += len(content)

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        written.append(rel)

    if not written:
        raise UploadRejected("Upload contained no supported files")
    return written


def resolve_within(base: Path, rel_path: str) -> Path:
    """Resolve rel_path under base, raising if it escapes the workspace."""
    rel = safe_relpath(rel_path)
    target = (base / rel).resolve()
    if not str(target).startswith(str(base.resolve())):
        raise UploadRejected(f"Path escapes workspace: {rel_path}")
    return target
