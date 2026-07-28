import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field
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


class WebsiteConfigUpdate(BaseModel):
    schemaVersion: Literal[1] = 1
    components: list[dict] = Field(default_factory=list, max_length=500)
    pages: list[dict] = Field(default_factory=list, max_length=50)
    currentPageId: str = Field(min_length=1, max_length=100)
    globalTheme: dict = Field(default_factory=dict)
    assets: list[dict] = Field(default_factory=list, max_length=250)
    device: Literal["desktop", "tablet", "mobile"] = "desktop"
    banner_url: str | None = Field(default=None, max_length=500)
    logo_url: str | None = Field(default=None, max_length=500)

    model_config = {"extra": "forbid"}


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
