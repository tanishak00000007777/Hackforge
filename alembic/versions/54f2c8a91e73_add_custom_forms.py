"""add custom forms

Revision ID: 54f2c8a91e73
Revises: 9765a245204b
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "54f2c8a91e73"
down_revision: Union[str, None] = "9765a245204b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    purpose = sa.Enum("submission", "quiz", name="formpurpose")
    access = sa.Enum("public", "authenticated", name="formaccess")
    form_status = sa.Enum("draft", "published", "closed", name="formstatus")
    question_type = sa.Enum("short_answer", "paragraph", "multiple_choice", "checkboxes", "file", name="questiontype")

    op.create_table(
        "custom_forms",
        sa.Column("hackathon_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("slug", sa.String(180), nullable=False),
        sa.Column("purpose", purpose, nullable=False),
        sa.Column("access", access, nullable=False),
        sa.Column("status", form_status, nullable=False),
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["hackathon_id"], ["hackathons.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_custom_forms_hackathon_id", "custom_forms", ["hackathon_id"])
    op.create_index("ix_custom_forms_slug", "custom_forms", ["slug"], unique=True)

    op.create_table(
        "form_questions",
        sa.Column("form_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("type", question_type, nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("options", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("max_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["form_id"], ["custom_forms.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("form_id", "position", name="uq_form_question_position"),
    )
    op.create_index("ix_form_questions_form_id", "form_questions", ["form_id"])

    op.create_table(
        "form_responses",
        sa.Column("form_id", sa.UUID(), nullable=False),
        sa.Column("submitter_user_id", sa.UUID()),
        sa.Column("total_score", sa.Integer()),
        sa.Column("feedback", sa.Text()),
        sa.Column("graded_at", sa.DateTime(timezone=True)),
        sa.Column("graded_by", sa.UUID()),
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["form_id"], ["custom_forms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["submitter_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["graded_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_form_responses_form_id", "form_responses", ["form_id"])
    op.create_index("ix_form_responses_submitter_user_id", "form_responses", ["submitter_user_id"])

    op.create_table(
        "form_answers",
        sa.Column("response_id", sa.UUID(), nullable=False),
        sa.Column("question_id", sa.UUID(), nullable=False),
        sa.Column("value", postgresql.JSONB()),
        sa.Column("awarded_points", sa.Integer()),
        sa.Column("feedback", sa.Text()),
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["response_id"], ["form_responses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["form_questions.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("response_id", "question_id", name="uq_response_question_answer"),
    )
    op.create_index("ix_form_answers_response_id", "form_answers", ["response_id"])

    op.create_table(
        "form_attachments",
        sa.Column("answer_id", sa.UUID(), nullable=False),
        sa.Column("asset_id", sa.String(255), nullable=False),
        sa.Column("public_id", sa.String(500), nullable=False),
        sa.Column("resource_type", sa.String(30), nullable=False),
        sa.Column("delivery_type", sa.String(30), nullable=False),
        sa.Column("format", sa.String(50)),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("mime_type", sa.String(255)),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["answer_id"], ["form_answers.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("answer_id"), sa.UniqueConstraint("asset_id"),
    )
    op.create_index("ix_form_attachments_answer_id", "form_attachments", ["answer_id"], unique=True)


def downgrade() -> None:
    op.drop_table("form_attachments")
    op.drop_table("form_answers")
    op.drop_table("form_responses")
    op.drop_table("form_questions")
    op.drop_table("custom_forms")
    for name in ("questiontype", "formstatus", "formaccess", "formpurpose"):
        sa.Enum(name=name).drop(op.get_bind(), checkfirst=True)
