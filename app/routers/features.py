import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.hackathon_features import (
    FeatureConfigUpdate,
    FeatureConfigResponse,
    FeatureStatusResponse,
)
from app.services.feature_service import get_features, update_features

router = APIRouter(prefix="/hackathons", tags=["Features"])


@router.get(
    "/{hackathon_id}/features",
    response_model=FeatureConfigResponse,
)
async def get_hackathon_features(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Organizer fetches current feature config.
    Used to populate the toggle panel in the dashboard.
    """
    return await get_features(hackathon_id, db)


@router.patch(
    "/{hackathon_id}/features",
    response_model=FeatureConfigResponse,
)
async def update_hackathon_features(
    hackathon_id: uuid.UUID,
    data: FeatureConfigUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Organizer enables or disables specific features.
    Only sends the fields that need to change.
    Example: {"teams_enabled": false}
    """
    return await update_features(hackathon_id, data, current_user, db)


@router.get(
    "/{hackathon_id}/features/public",
    response_model=FeatureStatusResponse,
)
async def get_public_features(
    hackathon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no login required.
    Participants use this to know which features are active.
    Frontend hides buttons for disabled features automatically.
    """
    return await get_features(hackathon_id, db)