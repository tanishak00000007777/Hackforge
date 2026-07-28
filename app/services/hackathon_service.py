from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.hackathon import Hackathon, HackathonStatus
from app.models.user import User
from app.schemas.hackathon import HackathonCreate, HackathonUpdate
import uuid
from app.services.feature_service import create_default_features


async def get_owned_hackathon(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Hackathon:
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.created_by == current_user.id,
        )
    )
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        # Do not reveal whether another organizer owns this event.
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon

async def create_hackathon(
    data: HackathonCreate,
    organization_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Hackathon:
    result = await db.execute(
        select(Hackathon).where(Hackathon.slug == data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon slug already taken",
        )

    hackathon = Hackathon(
        organization_id=organization_id,
        created_by=current_user.id,
        **data.model_dump(),
    )
    db.add(hackathon)
    await db.flush()
    await db.refresh(hackathon)

    # Auto-create feature flags with all defaults enabled
    await create_default_features(hackathon.id, db)
    
    return hackathon


async def get_hackathon_by_slug(slug: str, db: AsyncSession) -> Hackathon:
    result = await db.execute(
        select(Hackathon).where(Hackathon.slug == slug)
    )
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon


async def publish_hackathon(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Hackathon:
    hackathon = await get_owned_hackathon(hackathon_id, current_user, db)
    hackathon.status = HackathonStatus.published
    await db.flush()
    await db.refresh(hackathon)
    return hackathon


async def update_website_config(
    hackathon_id: uuid.UUID,
    config: dict,
    current_user: User,
    db: AsyncSession,
) -> Hackathon:
    hackathon = await get_owned_hackathon(hackathon_id, current_user, db)

    # Update website configuration JSON
    hackathon.website_config = config

    # Studio project saves must not erase media managed elsewhere.
    if "banner_url" in config:
        hackathon.banner_url = config["banner_url"]
    if "logo_url" in config:
        hackathon.logo_url = config["logo_url"]

    await db.flush()
    await db.refresh(hackathon)

    return hackathon


async def get_all_hackathons(db: AsyncSession) -> list[Hackathon]:
    result = await db.execute(
        select(Hackathon).where(Hackathon.status == HackathonStatus.published)
    )
    return list(result.scalars().all())


async def get_owned_hackathons(current_user: User, db: AsyncSession) -> list[Hackathon]:
    result = await db.execute(
        select(Hackathon).where(Hackathon.created_by == current_user.id).order_by(Hackathon.created_at.desc())
    )
    return list(result.scalars().all())
