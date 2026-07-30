import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ai_message import AIConversationMessage
from app.models.user import User
from app.schemas.ai import AIConversationMessageCreate

# Cap how much history a studio session ever loads back — the live agent
# loop already bounds a single turn (see ConversationManager's MAX_ROUNDS),
# this bounds how much of the persisted log gets sent back on page load.
MAX_HISTORY_MESSAGES = 200


async def save_message(
    hackathon_id: uuid.UUID,
    data: AIConversationMessageCreate,
    current_user: User,
    db: AsyncSession,
) -> AIConversationMessage:
    message = AIConversationMessage(
        hackathon_id=hackathon_id,
        user_id=current_user.id,
        role=data.role,
        content=data.content,
        tool_calls=[tc.model_dump() for tc in data.tool_calls] if data.tool_calls else None,
        tool_call_id=data.tool_call_id,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def get_conversation_history(
    hackathon_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> list[AIConversationMessage]:
    result = await db.execute(
        select(AIConversationMessage)
        .where(
            AIConversationMessage.hackathon_id == hackathon_id,
            AIConversationMessage.user_id == current_user.id,
        )
        .order_by(AIConversationMessage.created_at.asc())
        .limit(MAX_HISTORY_MESSAGES)
    )
    return list(result.scalars().all())
