import uuid
from datetime import datetime
from pydantic import BaseModel


class ScoreCreate(BaseModel):
    criterion_id: uuid.UUID
    score: int
    comment: str | None = None


class ScoreResponse(BaseModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    judge_id: uuid.UUID
    criterion_id: uuid.UUID
    score: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}