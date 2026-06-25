import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.analytics_service import get_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/{hackathon_id}")
async def hackathon_analytics(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_analytics(hackathon_id, db)    