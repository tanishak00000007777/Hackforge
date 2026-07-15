import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_feature
from app.services.leaderboard_service import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/{hackathon_id}")
async def hackathon_leaderboard(
    hackathon_id: uuid.UUID,
    _=Depends(require_feature("leaderboard_enabled")),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_leaderboard(hackathon_id, db)