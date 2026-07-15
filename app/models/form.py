import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import BaseModel


class FormPurpose(str, enum.Enum):
    submission = "submission"
    quiz = "quiz"


class FormAccess(str, enum.Enum):
    public = "public"
    authenticated = "authenticated"


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    closed = "closed"


class QuestionType(str, enum.Enum):
    short_answer = "short_answer"
    paragraph = "paragraph"
    multiple_choice = "multiple_choice"
    checkboxes = "checkboxes"
    file = "file"


class CustomForm(BaseModel):
    __tablename__ = "custom_forms"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    purpose: Mapped[FormPurpose] = mapped_column(SAEnum(FormPurpose, name="formpurpose"), default=FormPurpose.submission, nullable=False)
    access: Mapped[FormAccess] = mapped_column(SAEnum(FormAccess, name="formaccess"), default=FormAccess.public, nullable=False)
    status: Mapped[FormStatus] = mapped_column(SAEnum(FormStatus, name="formstatus"), default=FormStatus.draft, nullable=False)

    questions: Mapped[list["FormQuestion"]] = relationship(back_populates="form", cascade="all, delete-orphan", order_by="FormQuestion.position")
    responses: Mapped[list["FormResponse"]] = relationship(back_populates="form", cascade="all, delete-orphan")


class FormQuestion(BaseModel):
    __tablename__ = "form_questions"
    __table_args__ = (UniqueConstraint("form_id", "position", name="uq_form_question_position"),)

    form_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("custom_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    type: Mapped[QuestionType] = mapped_column(SAEnum(QuestionType, name="questiontype"), nullable=False)
    required: Mapped[bool] = mapped_column(default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    options: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    max_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    form: Mapped[CustomForm] = relationship(back_populates="questions")
    answers: Mapped[list["FormAnswer"]] = relationship(back_populates="question")


class FormResponse(BaseModel):
    __tablename__ = "form_responses"

    form_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("custom_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    submitter_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    total_score: Mapped[int | None] = mapped_column(Integer)
    feedback: Mapped[str | None] = mapped_column(Text)
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    graded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    form: Mapped[CustomForm] = relationship(back_populates="responses")
    answers: Mapped[list["FormAnswer"]] = relationship(back_populates="response", cascade="all, delete-orphan")


class FormAnswer(BaseModel):
    __tablename__ = "form_answers"
    __table_args__ = (UniqueConstraint("response_id", "question_id", name="uq_response_question_answer"),)

    response_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("form_responses.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("form_questions.id", ondelete="CASCADE"), nullable=False)
    value: Mapped[object | None] = mapped_column(JSONB)
    awarded_points: Mapped[int | None] = mapped_column(Integer)
    feedback: Mapped[str | None] = mapped_column(Text)

    response: Mapped[FormResponse] = relationship(back_populates="answers")
    question: Mapped[FormQuestion] = relationship(back_populates="answers")
    attachment: Mapped["FormAttachment | None"] = relationship(back_populates="answer", cascade="all, delete-orphan", uselist=False)


class FormAttachment(BaseModel):
    __tablename__ = "form_attachments"

    answer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("form_answers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    asset_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    public_id: Mapped[str] = mapped_column(String(500), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(30), nullable=False)
    delivery_type: Mapped[str] = mapped_column(String(30), nullable=False, default="private")
    format: Mapped[str | None] = mapped_column(String(50))
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255))
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)

    answer: Mapped[FormAnswer] = relationship(back_populates="attachment")
