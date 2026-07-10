from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings

from app.routers import (
    auth, users, organizations, hackathons, tracks,
    registrations, teams, submissions, judges, scores,
    leaderboard, certificates, announcements, sponsors, analytics,
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


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.app_version}