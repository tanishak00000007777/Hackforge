import uuid
from datetime import datetime
from pydantic import BaseModel


class FeatureConfigUpdate(BaseModel):
    """
    All fields are optional.
    Organizer sends only the fields they want to change.
    Example: {"teams_enabled": false} disables only teams.
    """
    registrations_enabled: bool | None = None
    teams_enabled: bool | None = None
    submissions_enabled: bool | None = None
    judging_enabled: bool | None = None
    leaderboard_enabled: bool | None = None
    certificates_enabled: bool | None = None
    announcements_enabled: bool | None = None


class FeatureConfigResponse(BaseModel):
    """
    Returned to both organizer and participant.
    Shows the current state of every feature flag.
    """
    id: uuid.UUID
    hackathon_id: uuid.UUID
    registrations_enabled: bool
    teams_enabled: bool
    submissions_enabled: bool
    judging_enabled: bool
    leaderboard_enabled: bool
    certificates_enabled: bool
    announcements_enabled: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeatureStatusResponse(BaseModel):
    """
    Lightweight public response.
    Participants use this to know what is currently active.
    """
    registrations_enabled: bool
    teams_enabled: bool
    submissions_enabled: bool
    judging_enabled: bool
    leaderboard_enabled: bool
    certificates_enabled: bool
    announcements_enabled: bool

    model_config = {"from_attributes": True}