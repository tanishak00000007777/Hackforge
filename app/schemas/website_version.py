import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VersionCreate(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    source: str = Field(default="manual", pattern="^(manual|ai|publish|restore)$")
    summary: str | None = Field(default=None, max_length=500)
    # Omit to checkpoint whatever the saved draft currently holds.
    project: dict | None = None


class VersionSummary(BaseModel):
    """List rows carry no `project` -- documents are large and the history
    panel only needs the metadata until a version is opened."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    version: int
    label: str
    source: str
    summary: str | None
    is_published: bool
    author_id: uuid.UUID | None
    created_at: datetime


class VersionDetail(VersionSummary):
    project: dict
