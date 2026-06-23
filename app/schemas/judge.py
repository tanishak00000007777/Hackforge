import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.judge import JudgeStatus


class JudgeInvite(BaseModel):
    user_id: uuid.UUID


class RubricCriteriaCreate(BaseModel):
    name: str
    description: str | None = None
    max_score: int = 10
    weight: int = 1
    sort_order: int = 0


class RubricCriteriaResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    name: str
    description: str | None
    max_score: int
    weight: int
    sort_order: int

    model_config = {"from_attributes": True}


class JudgeResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    status: JudgeStatus
    conflict_note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}