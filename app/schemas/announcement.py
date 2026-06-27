import uuid
from datetime import datetime
from pydantic import BaseModel


class AnnouncementCreate(BaseModel):
    title: str
    content: str


class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    author_id: uuid.UUID
    title: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}