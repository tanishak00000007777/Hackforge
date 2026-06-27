import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.certificate import CertificateType


class CertificateIssue(BaseModel):
    user_id: uuid.UUID
    type: CertificateType


class CertificateResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    type: CertificateType
    verification_id: str
    created_at: datetime

    model_config = {"from_attributes": True}