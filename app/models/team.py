import uuid
from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class Team(BaseModel):
    __tablename__ = "teams"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    leader_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # Relationships
    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    leader: Mapped["User"] = relationship("User", foreign_keys=[leader_id])
    members: Mapped[list["TeamMember"]] = relationship("TeamMember", back_populates="team")