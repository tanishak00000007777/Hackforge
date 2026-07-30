import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.ai import (
    AICopilotRequest,
    AICopilotResponse,
    AIConversationMessageCreate,
    AIConversationMessageResponse,
)
from app.services.ai_service import enforce_ai_rate_limit, request_ai_completion
from app.services import ai_conversation_service
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


@router.post(
    "/conversations/{hackathon_id}/messages",
    response_model=AIConversationMessageResponse,
    status_code=201,
)
async def save_conversation_message(
    hackathon_id: uuid.UUID,
    data: AIConversationMessageCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_hackathon(hackathon_id, current_user, db)
    return await ai_conversation_service.save_message(hackathon_id, data, current_user, db)


@router.get(
    "/conversations/{hackathon_id}/messages",
    response_model=list[AIConversationMessageResponse],
)
async def list_conversation_messages(
    hackathon_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_hackathon(hackathon_id, current_user, db)
    return await ai_conversation_service.get_conversation_history(hackathon_id, current_user, db)
