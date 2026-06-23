import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.registration import RegistrationStatus


class RegistrationCreate(BaseModel):
    form_data: dict = {}


class RegistrationStatusUpdate(BaseModel):
    status: RegistrationStatus


class RegistrationResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    status: RegistrationStatus
    form_data: dict
    created_at: datetime

    model_config = {"from_attributes": True}