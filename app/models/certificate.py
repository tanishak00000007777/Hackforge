import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class CertificateType(str, enum.Enum):
    participant = "participant"
    winner = "winner"
    runner_up = "runner_up"
    judge = "judge"


class Certificate(BaseModel):
    __tablename__ = "certificates"

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
    type: Mapped[CertificateType] = mapped_column(
        SAEnum(CertificateType),
        nullable=False,
    )
    verification_id: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False
    )

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")