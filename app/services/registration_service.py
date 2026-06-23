import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.registration import Registration, RegistrationStatus
from app.models.hackathon import Hackathon, RegistrationMode
from app.models.user import User
from app.schemas.registration import RegistrationCreate


async def register_for_hackathon(
    hackathon_id: uuid.UUID,
    data: RegistrationCreate,
    current_user: User,
    db: AsyncSession,
) -> Registration:
    # Check hackathon exists
    result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    # Check not already registered
    result = await db.execute(
        select(Registration).where(
            Registration.hackathon_id == hackathon_id,
            Registration.user_id == current_user.id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already registered")

    # Auto-approve if open registration
    initial_status = (
        RegistrationStatus.approved
        if hackathon.registration_mode == RegistrationMode.open
        else RegistrationStatus.pending
    )

    registration = Registration(
        hackathon_id=hackathon_id,
        user_id=current_user.id,
        status=initial_status,
        form_data=data.form_data,
    )
    db.add(registration)
    await db.flush()
    await db.refresh(registration)
    return registration


async def get_hackathon_registrations(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> list[Registration]:
    result = await db.execute(
        select(Registration).where(Registration.hackathon_id == hackathon_id)
    )
    return list(result.scalars().all())


async def update_registration_status(
    registration_id: uuid.UUID,
    new_status: RegistrationStatus,
    db: AsyncSession,
) -> Registration:
    result = await db.execute(
        select(Registration).where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    registration.status = new_status
    await db.flush()
    await db.refresh(registration)
    return registration