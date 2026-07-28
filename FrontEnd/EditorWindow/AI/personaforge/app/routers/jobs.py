from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import storage
from ..database import get_db, SessionLocal
from ..job_runner import run_personalisation_job, approve_job, reject_job
from ..models import Job, Project
from ..security import resolve_within, UploadRejected

router = APIRouter(tags=["jobs"])


class PersonaliseRequest(BaseModel):
    prompt: str
    preserve_layout: bool = True
    allow_component_addition: bool = True
    allow_component_removal: bool = True
    allow_javascript_edits: bool = False
    max_files_to_change: int = 8
    preview_only: bool = False


def _run_job_background(job_id: str):
    db = SessionLocal()
    try:
        run_personalisation_job(db, job_id)
    finally:
        db.close()


@router.post("/api/projects/{project_id}/personalise")
def create_personalisation_job(project_id: str, body: PersonaliseRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    if not body.prompt.strip():
        raise HTTPException(400, "Prompt is required")

    job = Job(
        project_id=project_id,
        prompt=body.prompt,
        settings=body.model_dump(exclude={"prompt"}),
        state="queued",
        stage="queued",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(_run_job_background, job.id)
    return {"job_id": job.id, "state": job.state}


def _job_or_404(db: Session, job_id: str) -> Job:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/api/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = _job_or_404(db, job_id)
    return {
        "id": job.id,
        "project_id": job.project_id,
        "prompt": job.prompt,
        "state": job.state,
        "stage": job.stage,
        "error_message": job.error_message,
        "intent": job.intent,
        "edit_plan": job.edit_plan,
        "changed_files": job.changed_files,
        "validation_result": job.validation_result,
        "diffs": job.diffs,
        "repaired": job.repaired,
    }


@router.post("/api/jobs/{job_id}/approve")
def approve(job_id: str, db: Session = Depends(get_db)):
    job = _job_or_404(db, job_id)
    if job.state != "needs_review":
        raise HTTPException(400, f"Job is not ready for approval (state={job.state})")
    project = db.get(Project, job.project_id)
    version = approve_job(db, job, project)
    return {"version": version.number}


@router.post("/api/jobs/{job_id}/reject")
def reject(job_id: str, db: Session = Depends(get_db)):
    job = _job_or_404(db, job_id)
    reject_job(db, job)
    return {"status": "rejected"}


@router.post("/api/jobs/{job_id}/retry")
def retry(job_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    old_job = _job_or_404(db, job_id)
    new_job = Job(project_id=old_job.project_id, prompt=old_job.prompt, settings=old_job.settings, state="queued", stage="queued")
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    background_tasks.add_task(_run_job_background, new_job.id)
    return {"job_id": new_job.id}


@router.get("/api/jobs/{job_id}/preview/{file_path:path}")
def job_preview_file(job_id: str, file_path: str, db: Session = Depends(get_db)):
    job = _job_or_404(db, job_id)
    workspace = storage.workspace_dir(job.project_id, job.id)
    try:
        target = resolve_within(workspace, file_path or "index.html")
    except UploadRejected as exc:
        raise HTTPException(400, str(exc))
    if not target.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(target, headers={"X-Frame-Options": "SAMEORIGIN", "Content-Security-Policy": "default-src 'self' 'unsafe-inline' data:"})


@router.get("/api/projects/{project_id}/preview/{version_number}/{file_path:path}")
def version_preview_file(project_id: str, version_number: int, file_path: str, db: Session = Depends(get_db)):
    root = storage.version_dir(project_id, version_number)
    try:
        target = resolve_within(root, file_path or "index.html")
    except UploadRejected as exc:
        raise HTTPException(400, str(exc))
    if not target.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(target, headers={"X-Frame-Options": "SAMEORIGIN", "Content-Security-Policy": "default-src 'self' 'unsafe-inline' data:"})
