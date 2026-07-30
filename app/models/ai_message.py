import uuid
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class AIConversationMessage(BaseModel):
    """One turn of the AI Copilot conversation for a hackathon's studio.
    Named AIConversationMessage (not AIMessage) to avoid colliding with the
    Pydantic request/response schema of the same short name in app/schemas/ai.py.
    """
    __tablename__ = "ai_messages"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tool_calls: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tool_call_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")
