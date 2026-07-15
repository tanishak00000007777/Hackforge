import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

from app.models.form import FormAccess, FormPurpose, FormStatus, QuestionType


class QuestionInput(BaseModel):
    id: uuid.UUID | None = None
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    type: QuestionType
    required: bool = False
    options: list[str] = []
    max_points: int = Field(default=0, ge=0, le=1000)

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if len(cleaned) != len(set(cleaned)):
            raise ValueError("Question options must be unique")
        return cleaned


class QuestionResponse(QuestionInput):
    id: uuid.UUID
    position: int


class FormCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    purpose: FormPurpose = FormPurpose.submission
    access: FormAccess = FormAccess.public


class FormUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    slug: str | None = Field(default=None, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=180)
    purpose: FormPurpose | None = None
    access: FormAccess | None = None


class FormSummary(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    title: str
    description: str | None
    slug: str
    purpose: FormPurpose
    access: FormAccess
    status: FormStatus
    created_at: datetime
    updated_at: datetime
    response_count: int = 0
    model_config = {"from_attributes": True}


class FormDetail(FormSummary):
    questions: list[QuestionResponse] = []


class PublicForm(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    slug: str
    purpose: FormPurpose
    access: FormAccess
    status: FormStatus
    questions: list[QuestionResponse]
    model_config = {"from_attributes": True}


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    original_filename: str
    mime_type: str | None
    byte_size: int
    model_config = {"from_attributes": True}


class AnswerResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    value: object | None
    awarded_points: int | None
    feedback: str | None
    attachment: AttachmentResponse | None = None
    model_config = {"from_attributes": True}


class ResponseSummary(BaseModel):
    id: uuid.UUID
    form_id: uuid.UUID
    submitter_user_id: uuid.UUID | None
    total_score: int | None
    feedback: str | None
    graded_at: datetime | None
    created_at: datetime
    model_config = {"from_attributes": True}


class ResponseDetail(ResponseSummary):
    answers: list[AnswerResponse]


class AnswerGrade(BaseModel):
    answer_id: uuid.UUID
    awarded_points: int = Field(ge=0)
    feedback: str | None = None


class GradeRequest(BaseModel):
    answers: list[AnswerGrade]
    feedback: str | None = None


class SubmissionCreated(BaseModel):
    id: uuid.UUID
    submitted_at: datetime
