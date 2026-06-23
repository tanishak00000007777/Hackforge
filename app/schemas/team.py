import uuid
from datetime import datetime
from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str


class TeamJoin(BaseModel):
    invite_code: str


class TeamMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    name: str
    invite_code: str
    leader_id: uuid.UUID
    members: list[TeamMemberResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}