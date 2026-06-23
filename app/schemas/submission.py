import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.submission import SubmissionStatus


class SubmissionCreate(BaseModel):
    title: str
    description: str
    github_url: str | None = None
    demo_url: str | None = None
    video_url: str | None = None
    deck_url: str | None = None
    ai_usage: str | None = None


class SubmissionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    video_url: str | None = None
    deck_url: str | None = None
    ai_usage: str | None = None


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    team_id: uuid.UUID
    title: str
    description: str
    github_url: str | None
    demo_url: str | None
    video_url: str | None
    deck_url: str | None
    ai_usage: str | None
    status: SubmissionStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}