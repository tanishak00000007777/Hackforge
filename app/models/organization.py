from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel
import uuid


class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="organizations")
    hackathons: Mapped[list["Hackathon"]] = relationship("Hackathon", back_populates="organization")