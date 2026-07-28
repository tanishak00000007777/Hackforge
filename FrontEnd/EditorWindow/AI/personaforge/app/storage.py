import hashlib
import shutil
from pathlib import Path

from . import config


def project_dir(project_id: str) -> Path:
    return config.PROJECTS_DIR / project_id


def version_dir(project_id: str, version: int) -> Path:
    return project_dir(project_id) / "versions" / str(version)


def workspace_dir(project_id: str, job_id: str) -> Path:
    return project_dir(project_id) / "workspaces" / job_id


def latest_version_dir(project_id: str, current_version: int) -> Path:
    return version_dir(project_id, current_version)


def copy_version_to(src_version_dir: Path, dest_dir: Path) -> None:
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    shutil.copytree(src_version_dir, dest_dir)


def detect_entry_file(root: Path, files: list[str]) -> str:
    if "index.html" in files:
        return "index.html"
    root_html = sorted(
        f for f in files
        if "/" not in f and f.lower().endswith((".html", ".htm"))
    )
    if root_html:
        return root_html[0]
    any_html = sorted(f for f in files if f.lower().endswith((".html", ".htm")))
    if any_html:
        return any_html[0]
    raise ValueError("No HTML entry file found in uploaded project")


def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def zip_directory(src_dir: Path, zip_path: Path) -> Path:
    shutil.make_archive(str(zip_path.with_suffix("")), "zip", src_dir)
    return zip_path
