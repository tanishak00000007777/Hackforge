"""End-to-end pipeline test with a scripted fake LLM provider (no live Ollama needed)."""
import shutil
from pathlib import Path

import pytest

from app.database import SessionLocal, Base, engine
from app.models import Project, Version, Job, new_id
from app import job_runner
from app.llm.provider import LLMProvider

SAMPLE_HTML = """<!doctype html><html><head><title>Home</title>
<link rel="stylesheet" href="style.css"></head>
<body><section class="hero"><h1 id="headline">Old Headline</h1></section></body></html>"""
SAMPLE_CSS = ".hero { color: black; }\n"


class FakeProvider(LLMProvider):
    def __init__(self):
        pass

    def complete_json(self, system_prompt, user_prompt, max_tokens=2048):
        if "structured requirements" in system_prompt:
            return {
                "goal": "Rebrand hero",
                "audience": "Recruiters",
                "tone": "Professional",
                "requested_changes": [{"type": "content_rewrite", "scope": "hero", "instruction": "Change headline", "priority": 5}],
                "hard_constraints": [],
                "inferred_preferences": [],
                "ambiguities": [],
                "allow_javascript_changes": False,
            }
        if "produce a file-level" in system_prompt:
            return {
                "summary": "Update hero headline",
                "changes": [{"file_path": "index.html", "component_key": "index.hero", "operation": "update_content",
                             "selectors": ["#headline"], "reason": "rebrand", "risk_level": "low"}],
                "files_to_preserve": [], "protected_identifiers": [], "warnings": [],
            }
        return {"operations": [{
            "operation_id": "op1", "file_path": "index.html", "operation": "set_text",
            "selector": "#headline", "new_value": "New Headline", "reason": "rebrand", "confidence": 0.9,
        }]}


def _setup_project(tmp_path, monkeypatch):
    monkeypatch.setattr("app.config.PROJECTS_DIR", tmp_path)
    monkeypatch.setattr("app.storage.config.PROJECTS_DIR", tmp_path)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    from app.analysis.manifest import build_manifest
    src = tmp_path / "src"
    src.mkdir()
    (src / "index.html").write_text(SAMPLE_HTML, encoding="utf-8")
    (src / "style.css").write_text(SAMPLE_CSS, encoding="utf-8")

    project_id = new_id()
    manifest = build_manifest(src, ["index.html", "style.css"], project_id, "Demo")
    project = Project(id=project_id, name="Demo", entry_file="index.html", manifest=manifest)
    db.add(project)

    from app import storage
    version_dir = storage.version_dir(project_id, 1)
    storage.copy_version_to(src, version_dir)
    db.add(Version(project_id=project_id, number=1, summary="original"))
    db.commit()
    return db, project


def test_full_personalisation_pipeline(tmp_path, monkeypatch):
    db, project = _setup_project(tmp_path, monkeypatch)
    monkeypatch.setattr(job_runner, "LLMProvider", FakeProvider)

    job = Job(project_id=project.id, prompt="Rebrand the hero", settings={"max_files_to_change": 8})
    db.add(job)
    db.commit()
    db.refresh(job)

    job_runner.run_personalisation_job(db, job.id)
    db.refresh(job)

    assert job.state == "needs_review", job.error_message
    assert "index.html" in job.changed_files
    assert job.validation_result["passed"] is True
    assert any("New Headline" in d["unified_diff"] for d in job.diffs)

    version = job_runner.approve_job(db, job, project)
    assert version.number == 2
    db.refresh(project)
    assert project.current_version == 2

    from app import storage
    approved_html = (storage.version_dir(project.id, 2) / "index.html").read_text()
    assert "New Headline" in approved_html


class RejectedThenRepairedProvider(FakeProvider):
    """First operations batch is refused by the applier (set_text on a
    container); the repair batch inserts instead. Mirrors 'add a heading X'."""

    def __init__(self):
        self.operation_calls = 0

    def complete_json(self, system_prompt, user_prompt, max_tokens=2048):
        if "repair" in system_prompt.lower():
            return {"operations": [{
                "operation_id": "r1", "file_path": "index.html", "operation": "insert_after",
                "selector": "#headline", "content": "<h2>Arshia Princess</h2>",
                "reason": "add the requested heading", "confidence": 0.9,
            }]}
        if "structured requirements" in system_prompt or "produce a file-level" in system_prompt:
            return super().complete_json(system_prompt, user_prompt, max_tokens)
        return {"operations": [{
            "operation_id": "1", "file_path": "index.html", "operation": "set_text",
            "selector": ".hero", "new_value": "Arshia Princess", "reason": "add heading", "confidence": 0.9,
        }]}


def test_wholly_rejected_batch_is_repaired_not_failed(tmp_path, monkeypatch):
    """Every op rejected used to fail the job before the repair pass ever ran."""
    db, project = _setup_project(tmp_path, monkeypatch)
    monkeypatch.setattr(job_runner, "LLMProvider", RejectedThenRepairedProvider)

    job = Job(project_id=project.id, prompt="add a heading Arshia Princess", settings={"max_files_to_change": 8})
    db.add(job)
    db.commit()
    db.refresh(job)

    job_runner.run_personalisation_job(db, job.id)
    db.refresh(job)

    assert job.state == "needs_review", job.error_message
    assert job.repaired is True
    assert "index.html" in job.changed_files
    assert any("Arshia Princess" in d["unified_diff"] for d in job.diffs)
    assert any("Refusing set_text" in w for w in job.validation_result["warnings"])

    from app import storage
    html = (storage.workspace_dir(project.id, job.id) / "index.html").read_text(encoding="utf-8")
    assert "Arshia Princess" in html
    assert "Old Headline" in html, "the refused set_text must not have eaten the existing hero"


def test_insert_without_content_is_rejected():
    from app.edit_apply import apply_html_operation, EditApplyError
    from app.schemas import EditOperation

    op = EditOperation(operation_id="1", file_path="index.html", operation="insert_after",
                       selector="#headline", content=None, reason="add")

    with pytest.raises(EditApplyError, match="requires 'content'"):
        apply_html_operation(SAMPLE_HTML, op, set(), set())
