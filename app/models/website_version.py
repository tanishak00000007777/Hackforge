import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import BaseModel


class WebsiteVersion(BaseModel):
    """A point-in-time snapshot of a hackathon's website project.

    `hackathons.website_config` stays the live draft and is still overwritten
    by autosave. This table is the history alongside it: every structural edit
    checkpoint and every publish keeps its own immutable copy, which is what
    lets a publish be rolled back without touching the draft the organizer is
    still editing.
    """

    __tablename__ = "website_versions"
    __table_args__ = (
        # Version numbers are per hackathon, not global.
        UniqueConstraint("hackathon_id", "version", name="uq_website_version_number"),
        # The two hot queries: list a hackathon's history newest-first, and
        # find its current live version.
        Index("ix_website_versions_hackathon_version", "hackathon_id", "version"),
        Index("ix_website_versions_published", "hackathon_id", "is_published"),
    )

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Nullable so a version outlives the account that made it.
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    version: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    # "manual" | "ai" | "publish" | "restore" -- who or what caused it.
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    summary: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # The full project document, exactly as the studio would hydrate it.
    project: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Exactly one row per hackathon may be true; enforced in the service so a
    # publish demotes the previous live version in the same transaction.
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    author: Mapped["User"] = relationship("User")
