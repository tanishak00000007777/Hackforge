import uuid
from datetime import datetime
from pydantic import BaseModel


class TrackCreate(BaseModel):
    name: str
    description: str | None = None
    prize: str | None = None
    sort_order: int = 0


class TrackResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    name: str
    description: str | None
    prize: str | None
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}