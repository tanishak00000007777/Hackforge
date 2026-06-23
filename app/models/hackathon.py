import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Integer, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class HackathonMode(str, enum.Enum):
    online = "online"
    offline = "offline"
    hybrid = "hybrid"


class HackathonStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    ongoing = "ongoing"
    ended = "ended"


class RegistrationMode(str, enum.Enum):
    open = "open"
    approval = "approval"


class Hackathon(BaseModel):
    __tablename__ = "hackathons"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    mode: Mapped[HackathonMode] = mapped_column(
        SAEnum(HackathonMode), default=HackathonMode.online
    )
    status: Mapped[HackathonStatus] = mapped_column(
        SAEnum(HackathonStatus), default=HackathonStatus.draft
    )
    start_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_open: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_close: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_deadline: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    venue: Mapped[str | None] = mapped_column(String(500), nullable=True)
    max_participants: Mapped[int] = mapped_column(Integer, default=200)
    max_team_size: Mapped[int] = mapped_column(Integer, default=4)
    min_team_size: Mapped[int] = mapped_column(Integer, default=1)
    registration_mode: Mapped[RegistrationMode] = mapped_column(
        SAEnum(RegistrationMode), default=RegistrationMode.open
    )
    website_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    prize_pool: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="hackathons")
    creator: Mapped["User"] = relationship("User")