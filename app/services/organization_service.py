from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationCreate
import uuid


async def create_organization(
    data: OrganizationCreate,
    current_user: User,
    db: AsyncSession,
) -> Organization:
    # Check slug uniqueness
    result = await db.execute(
        select(Organization).where(Organization.slug == data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization slug already taken",
        )

    org = Organization(
        name=data.name,
        slug=data.slug,
        description=data.description,
        website_url=data.website_url,
        owner_id=current_user.id,
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


async def get_my_organizations(
    current_user: User,
    db: AsyncSession,
) -> list[Organization]:
    result = await db.execute(
        select(Organization).where(Organization.owner_id == current_user.id)
    )
    return list(result.scalars().all())