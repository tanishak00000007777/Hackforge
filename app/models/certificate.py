import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class CertificateType(str, enum.Enum):
    participant = "participant"
    winner = "winner"
    runner_up = "runner_up"
    judge = "judge"


class Certificate(BaseModel):
    __tablename__ = "certificates"
    __table_args__ = (
        UniqueConstraint("hackathon_id", "user_id", "type", name="uq_certificate_recipient_type"),
    )

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


class CertificateTemplate(BaseModel):
    __tablename__ = "certificate_templates"
    __table_args__ = (
        UniqueConstraint("hackathon_id", name="uq_certificate_template_hackathon"),
    )

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )
    preset: Mapped[str] = mapped_column(String(20), default="classic", nullable=False)
    primary_color: Mapped[str] = mapped_column(String(7), default="#2B0A5A", nullable=False)
    secondary_color: Mapped[str] = mapped_column(String(7), default="#C084FC", nullable=False)
    heading: Mapped[str] = mapped_column(String(120), default="Certificate of Achievement", nullable=False)
    body_text: Mapped[str] = mapped_column(String(300), default="This certificate is proudly presented to", nullable=False)
    signatory_name: Mapped[str] = mapped_column(String(120), default="Event Organizer", nullable=False)
    signatory_title: Mapped[str] = mapped_column(String(120), default="Hackathon Organizer", nullable=False)
    sponsor_names: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
