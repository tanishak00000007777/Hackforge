import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.hackathon_features import HackathonFeature
from app.models.hackathon import Hackathon
from app.models.user import User
from app.schemas.hackathon_features import FeatureConfigUpdate


async def get_or_create_features(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> HackathonFeature:
    """
    Fetches the feature config for a hackathon.
    If it doesn't exist yet, creates it with all defaults enabled.
    This is the safe fallback in case eager creation was missed.
    """
    result = await db.execute(
        select(HackathonFeature).where(
            HackathonFeature.hackathon_id == hackathon_id
        )
    )
    features = result.scalar_one_or_none()

    if not features:
        features = HackathonFeature(hackathon_id=hackathon_id)
        db.add(features)
        await db.flush()
        await db.refresh(features)

    return features


async def get_features(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> HackathonFeature:
    """
    Returns current feature config.
    Used by organizer dashboard and participant pages.
    """
    return await get_or_create_features(hackathon_id, db)


async def update_features(
    hackathon_id: uuid.UUID,
    data: FeatureConfigUpdate,
    current_user: User,
    db: AsyncSession,
) -> HackathonFeature:
    """
    Organizer updates feature flags.
    Only the hackathon creator can modify features.
    Only fields sent in the request are updated.
    """
    # Verify hackathon exists and user owns it
    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    features = await get_or_create_features(hackathon_id, db)

    # Only update fields that were explicitly sent
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(features, field, value)

    await db.flush()
    await db.refresh(features)
    return features


async def create_default_features(
    hackathon_id: uuid.UUID,
    db: AsyncSession,
) -> HackathonFeature:
    """
    Called automatically when a hackathon is created.
    Creates a feature row with all flags set to True.
    """
    features = HackathonFeature(hackathon_id=hackathon_id)
    db.add(features)
    await db.flush()
    await db.refresh(features)
    return features


async def check_feature_enabled(
    hackathon_id: uuid.UUID,
    feature_name: str,
    db: AsyncSession,
) -> None:
    """
    Core check used by require_feature() dependency.
    Raises 403 if the requested feature is disabled.
    feature_name must match the column name exactly.
    Example: "teams_enabled", "submissions_enabled"
    """
    features = await get_or_create_features(hackathon_id, db)

    is_enabled = getattr(features, feature_name, None)

    if is_enabled is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown feature: {feature_name}",
        )

    if not is_enabled:
        # Convert "teams_enabled" → "Teams" for readable error
        readable = feature_name.replace("_enabled", "").replace("_", " ").title()
        raise HTTPException(
            status_code=403,
            detail=f"{readable} feature is currently disabled for this hackathon",
        )