import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_feature
from app.schemas.registration import RegistrationCreate, RegistrationResponse, RegistrationStatusUpdate
from app.services.registration_service import (
    register_for_hackathon,
    get_hackathon_registrations,
    update_registration_status,
)

router = APIRouter(prefix="/registrations", tags=["Registrations"])


@router.post("/{hackathon_id}", response_model=RegistrationResponse, status_code=201)
async def register(
    hackathon_id: uuid.UUID,
    data: RegistrationCreate,
    _=Depends(require_feature("registrations_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await register_for_hackathon(hackathon_id, data, current_user, db)



@router.get("/{hackathon_id}", response_model=list[RegistrationResponse])
async def list_registrations(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_hackathon_registrations(hackathon_id, db)


@router.patch("/{registration_id}/status", response_model=RegistrationResponse)
async def update_status(
    registration_id: uuid.UUID,
    data: RegistrationStatusUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_registration_status(registration_id, data.status, db)