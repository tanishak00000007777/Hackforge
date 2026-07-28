from pathlib import Path

from sqlalchemy.orm import Session

from . import storage
from .models import Job, Project, Version, now
from .llm.provider import LLMProvider, LLMError
from .llm import pipeline as llm_pipeline
from .retrieval import rank_files, build_manifest_excerpt, read_snippets, build_selector_menus
from .edit_apply import apply_operations
from .validation import validate_workspace
from .diffing import diff_files
from .storage import file_hash

STAGES = [
    "understanding_request", "selecting_relevant_components", "planning_changes",
    "generating_edits", "applying_modifications", "validating_website",
    "repairing_issues", "generating_preview", "completed",
]


def _set_stage(db: Session, job: Job, stage: str, state: str = "running"):
    job.stage = stage
    job.state = state
    job.updated_at = now()
    db.add(job)
    db.commit()


def _fail(db: Session, job: Job, message: str):
    job.state = "failed"
    job.stage = job.stage
    job.error_message = message
    job.updated_at = now()
    db.add(job)
    db.commit()


def _js_hashes(root: Path, manifest: dict) -> dict[str, str]:
    return {
        f["path"]: file_hash(root / f["path"])
        for f in manifest["files"]
        if f["type"] == "js" and (root / f["path"]).exists()
    }


def run_personalisation_job(db: Session, job_id: str) -> None:
    job = db.get(Job, job_id)
    project = db.get(Project, job.project_id)
    manifest = project.manifest
    provider = LLMProvider()

    src_version_dir = storage.version_dir(project.id, project.current_version)
    workspace = storage.workspace_dir(project.id, job.id)

    try:
        _set_stage(db, job, "understanding_request")
        intent = llm_pipeline.extract_intent(provider, job.prompt)
        job.intent = intent.model_dump()

        settings = job.settings or {}
        allow_js = intent.allow_javascript_changes and settings.get("allow_javascript_edits", False)

        _set_stage(db, job, "selecting_relevant_components")
        relevant_files = rank_files(manifest, job.prompt, top_n=settings.get("max_files_to_change", 8))
        manifest_excerpt = build_manifest_excerpt(manifest, relevant_files)

        _set_stage(db, job, "planning_changes")
        plan = llm_pipeline.plan_edits(provider, intent, manifest_excerpt)
        job.edit_plan = plan.model_dump()

        planned_files = {c.file_path for c in plan.changes} or set(relevant_files)
        if not allow_js:
            planned_files = {f for f in planned_files if not f.endswith(".js")}

        _set_stage(db, job, "generating_edits")
        snippets = read_snippets(Path(src_version_dir), sorted(planned_files))
        op_batch = llm_pipeline.generate_operations(provider, plan, snippets, build_selector_menus(snippets))
        job.operations = op_batch.model_dump()

        storage.copy_version_to(src_version_dir, workspace)
        original_js_hashes = _js_hashes(workspace, manifest)

        _set_stage(db, job, "applying_modifications")
        changed_files, apply_warnings = apply_operations(
            workspace, op_batch.operations, manifest["protected_ids"], manifest["protected_classes"],
        )
        job.changed_files = changed_files

        if changed_files:
            _set_stage(db, job, "validating_website")
            result = validate_workspace(workspace, manifest, allow_js, original_js_hashes)
        else:
            # Every operation was rejected. That is the case the repair pass is
            # most useful for, so do not bail out before running it.
            result = {"passed": False, "errors": []}
        result["warnings"] = apply_warnings

        # Rejected operations are repairable too: the applier's refusal says
        # exactly what was wrong (bad selector, destructive target), so feed it
        # back rather than shipping a job that silently dropped half the edits.
        if not result["passed"] or apply_warnings:
            _set_stage(db, job, "repairing_issues")
            try:
                repair_snippets = read_snippets(workspace, changed_files or sorted(planned_files))
                repair_batch = llm_pipeline.generate_repair(
                    provider, intent, result["errors"] + apply_warnings, repair_snippets,
                    manifest["protected_ids"], build_selector_menus(repair_snippets),
                )
                repaired_files, repair_warnings = apply_operations(
                    workspace, repair_batch.operations, manifest["protected_ids"], manifest["protected_classes"],
                )
                changed_files = sorted(set(changed_files) | set(repaired_files))
                job.changed_files = changed_files
                job.repaired = bool(repaired_files)
                if changed_files:
                    result = validate_workspace(workspace, manifest, allow_js, original_js_hashes)
                result["warnings"] = apply_warnings + repair_warnings
            except LLMError as exc:
                result["warnings"] = apply_warnings + [f"repair attempt failed: {exc}"]

        if not changed_files:
            # Still nothing to review after the repair pass: report why rather
            # than presenting an empty diff as a success.
            reason = "; ".join(result["warnings"]) or "the model returned no applicable edits"
            _fail(db, job, f"No changes could be applied: {reason}")
            return

        _set_stage(db, job, "generating_preview")
        job.diffs = diff_files(Path(src_version_dir), workspace, changed_files)

        # Personalisation edits are small by definition. A diff that mostly
        # deletes means an operation ate markup it should not have -- never let
        # that reach the user as a clean pass.
        gutted = [
            f"{d['file']} lost {d['deletions']} lines (only {d['additions']} added)"
            for d in job.diffs
            if d["deletions"] >= 20 and d["deletions"] > 4 * max(d["additions"], 1)
        ]
        if gutted:
            result["passed"] = False
            result["errors"] = result.get("errors", []) + [
                "Large deletion detected, review the diff before approving: " + "; ".join(gutted)
            ]

        job.validation_result = result

        job.state = "needs_review"
        job.stage = "completed"
        job.updated_at = now()
        db.add(job)
        db.commit()

    except LLMError as exc:
        _fail(db, job, str(exc))
    except Exception as exc:  # keep the job queryable instead of hanging in "running"
        _fail(db, job, f"Unexpected error: {exc}")


def approve_job(db: Session, job: Job, project: Project) -> Version:
    workspace = storage.workspace_dir(project.id, job.id)
    new_number = project.current_version + 1
    dest = storage.version_dir(project.id, new_number)
    storage.copy_version_to(workspace, dest)

    version = Version(
        project_id=project.id,
        number=new_number,
        job_id=job.id,
        prompt=job.prompt,
        summary=(job.edit_plan or {}).get("summary", ""),
        changed_files=job.changed_files,
        validation_result=job.validation_result,
    )
    project.current_version = new_number
    job.state = "approved"
    db.add_all([version, project, job])
    db.commit()
    db.refresh(version)
    return version


def reject_job(db: Session, job: Job) -> None:
    job.state = "rejected"
    db.add(job)
    db.commit()
