from pathlib import Path

import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import models  # noqa: F401 (registers tables)
from .database import engine, Base
from .routers import projects, jobs

Base.metadata.create_all(bind=engine)

APP_DIR = Path(__file__).resolve().parent

app = FastAPI(title="PersonaForge")
app.mount("/static", StaticFiles(directory=APP_DIR / "static"), name="static")
templates = Jinja2Templates(directory=APP_DIR / "templates")

# Only needed when the studio frontend is served from another origin; in dev it
# proxies /api, so this stays empty (no CORS) unless deliberately configured.
_cors_origins = [o for o in os.environ.get("PERSONAFORGE_CORS_ORIGINS", "").split(",") if o.strip()]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware, allow_origins=_cors_origins, allow_methods=["*"], allow_headers=["*"],
    )

app.include_router(projects.router)
app.include_router(jobs.router)


@app.get("/")
def dashboard(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/projects/{project_id}")
def project_page(request: Request, project_id: str):
    return templates.TemplateResponse(request, "project.html", {"project_id": project_id})
