import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import config, storage
from ..analysis.manifest import build_manifest
from ..database import get_db
from ..models import Project, Version, new_id
from ..security import UploadRejected, extract_zip, write_uploaded_files

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _strip_common_prefix(names: list[str]) -> list[str]:
    """A browser folder picker sends paths like 'myproject/index.html' for
    every file. Strip that shared top-level folder so files land the same
    way a ZIP's contents would."""
    parts = [n.split("/", 1) for n in names]
    if all(len(p) == 2 for p in parts) and len({p[0] for p in parts}) == 1:
        return [p[1] for p in parts]
    return names


def _save_project(project_name: str, extract_dir: Path, files: list[str], db: Session) -> dict:
    project = Project(id=new_id(), name=project_name, entry_file="", manifest={})
    manifest = build_manifest(extract_dir, files, project.id, project_name)

    project.entry_file = manifest["entry_file"]
    project.manifest = manifest
    db.add(project)

    version_dir = storage.version_dir(project.id, 1)
    storage.copy_version_to(extract_dir, version_dir)

    db.add(Version(project_id=project.id, number=1, prompt=None, summary="Original upload", changed_files=[]))
    db.commit()
    db.refresh(project)
    return {"project_id": project.id, "manifest": manifest}


@router.post("")
def upload_project(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    """Accepts either a single ZIP file or a raw set of project files (e.g.
    from a folder picker) -- HTML/CSS/JS, or a React project's built static
    output. No ZIP is required."""
    if not files:
        raise HTTPException(400, "No files uploaded")

    is_single_zip = len(files) == 1 and files[0].filename.lower().endswith(".zip")

    with tempfile.TemporaryDirectory() as tmp:
        extract_dir = Path(tmp) / "extracted"
        try:
            if is_single_zip:
                tmp_zip = Path(tmp) / "upload.zip"
                size = 0
                with open(tmp_zip, "wb") as out:
                    while chunk := files[0].file.read(1024 * 1024):
                        size += len(chunk)
                        if size > config.MAX_UPLOAD_BYTES:
                            raise HTTPException(400, "Upload exceeds maximum size")
                        out.write(chunk)
                extracted_files = extract_zip(tmp_zip, extract_dir)
                project_name = Path(files[0].filename).stem
            else:
                original_names = [f.filename for f in files]
                first_segment = original_names[0].split("/", 1)
                project_name = first_segment[0] if len(first_segment) == 2 else "Uploaded Project"
                names = _strip_common_prefix(original_names)

                total_size = 0
                items: list[tuple[str, bytes]] = []
                for f, name in zip(files, names):
                    content = f.file.read()
                    total_size += len(content)
                    if total_size > config.MAX_UPLOAD_BYTES:
                        raise HTTPException(400, "Upload exceeds maximum size")
                    items.append((name, content))
                extracted_files = write_uploaded_files(items, extract_dir)

            result = _save_project(project_name, extract_dir, extracted_files, db)
        except UploadRejected as exc:
            raise HTTPException(400, str(exc))
        except ValueError as exc:
            raise HTTPException(400, str(exc))

    return result


@router.get("")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "entry_file": p.entry_file,
            "current_version": p.current_version,
            "created_at": p.created_at,
            "page_count": len(p.manifest.get("pages", [])),
            "html_count": sum(1 for f in p.manifest.get("files", []) if f["type"] == "html"),
            "css_count": sum(1 for f in p.manifest.get("files", []) if f["type"] == "css"),
            "js_count": sum(1 for f in p.manifest.get("files", []) if f["type"] == "js"),
        }
        for p in projects
    ]


def _get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    return {
        "id": project.id,
        "name": project.name,
        "entry_file": project.entry_file,
        "current_version": project.current_version,
        "manifest": project.manifest,
    }


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    shutil.rmtree(storage.project_dir(project_id), ignore_errors=True)
    db.delete(project)
    db.commit()
    return {"status": "deleted"}


@router.get("/{project_id}/versions")
def list_versions(project_id: str, db: Session = Depends(get_db)):
    _get_project_or_404(db, project_id)
    versions = db.query(Version).filter(Version.project_id == project_id).order_by(Version.number).all()
    return [
        {
            "number": v.number,
            "job_id": v.job_id,
            "prompt": v.prompt,
            "summary": v.summary,
            "changed_files": v.changed_files,
            "created_at": v.created_at,
        }
        for v in versions
    ]


@router.post("/{project_id}/versions/{version_number}/restore")
def restore_version(project_id: str, version_number: int, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    src = storage.version_dir(project_id, version_number)
    if not src.exists():
        raise HTTPException(404, "Version not found")

    old_version = db.query(Version).filter(Version.project_id == project_id, Version.number == version_number).first()
    new_number = project.current_version + 1
    dest = storage.version_dir(project_id, new_number)
    storage.copy_version_to(src, dest)

    version = Version(
        project_id=project_id,
        number=new_number,
        prompt=None,
        summary=f"Restored from version {version_number}",
        changed_files=old_version.changed_files if old_version else [],
    )
    project.current_version = new_number
    db.add_all([version, project])
    db.commit()
    return {"restored_as_version": new_number}


@router.get("/{project_id}/download")
def download_project(project_id: str, version: int | None = None, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    version_number = version or project.current_version
    src = storage.version_dir(project_id, version_number)
    if not src.exists():
        raise HTTPException(404, "Version not found")

    zip_path = storage.project_dir(project_id) / f"download-v{version_number}.zip"
    storage.zip_directory(src, zip_path)
    return FileResponse(zip_path, filename=f"{project.name}-v{version_number}.zip", media_type="application/zip")
