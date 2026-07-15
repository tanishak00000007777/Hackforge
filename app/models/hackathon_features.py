import uuid
from sqlalchemy import Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class HackathonFeature(BaseModel):
    __tablename__ = "hackathon_features"

    __table_args__ = (
        UniqueConstraint("hackathon_id", name="uq_hackathon_features_hackathon_id"),
        # One row per hackathon — enforced at DB level
    )

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Core features — all enabled by default
    registrations_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    teams_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    submissions_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    judging_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    leaderboard_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    certificates_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    announcements_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship back to hackathon
    hackathon: Mapped["Hackathon"] = relationship("Hackathon")