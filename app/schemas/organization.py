import uuid
from datetime import datetime
from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    website_url: str | None = None


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    website_url: str | None
    owner_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}