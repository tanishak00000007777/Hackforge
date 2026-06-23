import uuid
from sqlalchemy import String, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class RubricCriteria(BaseModel):
    __tablename__ = "rubric_criteria"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_score: Mapped[int] = mapped_column(Integer, default=10)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")