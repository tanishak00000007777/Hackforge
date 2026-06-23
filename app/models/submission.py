import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class SubmissionStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    disqualified = "disqualified"


class Submission(BaseModel):
    __tablename__ = "submissions"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    deck_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_usage: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(SubmissionStatus),
        default=SubmissionStatus.draft,
        nullable=False,
    )

    # Relationships
    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    team: Mapped["Team"] = relationship("Team")