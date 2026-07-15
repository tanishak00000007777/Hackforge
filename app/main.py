from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from app.config.settings import get_settings

from app.routers import (
    auth, users, organizations, hackathons, tracks,
    registrations, teams, submissions, judges, scores,
    leaderboard, certificates, announcements, sponsors, analytics,features
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="HackForge — Customizable Hackathon Hosting SaaS",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
@app.exception_handler(TimeoutError)
async def database_error_handler(request, exc):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database temporarily unavailable. Please try again shortly."},
    )

API_PREFIX = "/api/v1"

app.include_router(auth.router,          prefix=API_PREFIX)
app.include_router(users.router,         prefix=API_PREFIX)
app.include_router(organizations.router, prefix=API_PREFIX)
app.include_router(hackathons.router,    prefix=API_PREFIX)
app.include_router(tracks.router,        prefix=API_PREFIX)
app.include_router(registrations.router, prefix=API_PREFIX)
app.include_router(teams.router,         prefix=API_PREFIX)
app.include_router(submissions.router,   prefix=API_PREFIX)
app.include_router(judges.router,        prefix=API_PREFIX)
app.include_router(scores.router,        prefix=API_PREFIX)
app.include_router(leaderboard.router,   prefix=API_PREFIX)
app.include_router(certificates.router,  prefix=API_PREFIX)
app.include_router(announcements.router, prefix=API_PREFIX)
app.include_router(sponsors.router,      prefix=API_PREFIX)
app.include_router(analytics.router,     prefix=API_PREFIX)
app.include_router(features.router,      prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.app_version}


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "FrontEnd"
STUDIO_DIR = FRONTEND_DIR / "EditorWindow" / "Editor window" / "hackforge-studio" / "dist"
REACT_ROUTES = {
    "/": "/",
    "/login": "/login",
    "/organizer": "/organizer",
    "/participant": "/participant",
    "/judge": "/judge",
    "/judges": "/judge",
    "/templates": "/templates",
}

for path, react_path in REACT_ROUTES.items():
    async def page(route=react_path):
        return RedirectResponse(f"{settings.frontend_url.rstrip('/')}{route}")
    app.add_api_route(path, page, include_in_schema=False)

@app.get("/dashboard", include_in_schema=False)
async def dashboard():
    return RedirectResponse(f"{settings.frontend_url.rstrip('/')}/login")

# app.mount("/studio", StaticFiles(directory=STUDIO_DIR, html=True), name="studio")
