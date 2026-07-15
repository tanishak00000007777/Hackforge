import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.certificate import CertificateType


CertificatePreset = Literal["classic", "modern", "bold"]


class CertificateTemplateInput(BaseModel):
    preset: CertificatePreset = "classic"
    primary_color: str = "#2B0A5A"
    secondary_color: str = "#C084FC"
    heading: str = Field(default="Certificate of Achievement", min_length=1, max_length=120)
    body_text: str = Field(default="This certificate is proudly presented to", min_length=1, max_length=300)
    signatory_name: str = Field(default="Event Organizer", min_length=1, max_length=120)
    signatory_title: str = Field(default="Hackathon Organizer", min_length=1, max_length=120)
    sponsor_names: list[str] = Field(default_factory=list, max_length=8)

    @field_validator("primary_color", "secondary_color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", value):
            raise ValueError("Color must be a six-digit hex value")
        return value.upper()

    @field_validator("sponsor_names")
    @classmethod
    def validate_sponsors(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if any(len(value) > 100 for value in cleaned):
            raise ValueError("Sponsor names must be 100 characters or fewer")
        return cleaned


class CertificateTemplateResponse(CertificateTemplateInput):
    id: uuid.UUID | None = None
    hackathon_id: uuid.UUID

    model_config = {"from_attributes": True}


class CertificateBulkIssue(BaseModel):
    type: CertificateType
    team_ids: list[uuid.UUID] = Field(default_factory=list)


class CertificateBulkResult(BaseModel):
    issued: int
    skipped: int
    total: int


class CertificateResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    type: CertificateType
    verification_id: str
    recipient_name: str
    event_title: str
    created_at: datetime


class CertificateVerificationResponse(BaseModel):
    verification_id: str
    recipient_name: str
    event_title: str
    type: CertificateType
    issued_at: datetime
    valid: bool = True
