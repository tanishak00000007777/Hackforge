import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class JudgeStatus(str, enum.Enum):
    invited = "invited"
    accepted = "accepted"
    declined = "declined"


class Judge(BaseModel):
    __tablename__ = "judges"

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
    status: Mapped[JudgeStatus] = mapped_column(
        SAEnum(JudgeStatus),
        default=JudgeStatus.invited,
        nullable=False,
    )
    conflict_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")