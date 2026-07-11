import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.hackathon import HackathonMode, HackathonStatus, RegistrationMode


class HackathonCreate(BaseModel):
    title: str
    slug: str
    tagline: str | None = None
    description: str | None = None
    mode: HackathonMode = HackathonMode.online
    max_participants: int = 200
    max_team_size: int = 4
    min_team_size: int = 1
    registration_mode: RegistrationMode = RegistrationMode.open
    prize_pool: str | None = None
    contact_email: str | None = None


class HackathonUpdate(BaseModel):
    title: str | None = None
    tagline: str | None = None
    description: str | None = None
    mode: HackathonMode | None = None
    venue: str | None = None
    prize_pool: str | None = None
    contact_email: str | None = None


class HackathonResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    slug: str
    tagline: str | None
    description: str | None = None
    mode: HackathonMode
    status: HackathonStatus
    max_participants: int
    max_team_size: int
    min_team_size: int
    registration_mode: RegistrationMode
    website_config: dict | None = None
    banner_url: str | None
    logo_url: str | None
    prize_pool: str | None
    contact_email: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
