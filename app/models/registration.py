import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class RegistrationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    waitlisted = "waitlisted"


class Registration(BaseModel):
    __tablename__ = "registrations"

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
    status: Mapped[RegistrationStatus] = mapped_column(
        SAEnum(RegistrationStatus),
        default=RegistrationStatus.pending,
        nullable=False,
    )
    form_data: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")