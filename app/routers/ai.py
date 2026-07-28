from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.ai import AICopilotRequest, AICopilotResponse
from app.services.ai_service import enforce_ai_rate_limit, request_ai_completion
from app.services.hackathon_service import get_owned_hackathon


router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/copilot", response_model=AICopilotResponse)
async def copilot(
    data: AICopilotRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_hackathon(data.hackathon_id, current_user, db)
    await enforce_ai_rate_limit(str(current_user.id))
    return await request_ai_completion(data)
