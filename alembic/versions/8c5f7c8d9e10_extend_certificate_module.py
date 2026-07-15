"""extend certificate module

Revision ID: 8c5f7c8d9e10
Revises: 54f2c8a91e73
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "8c5f7c8d9e10"
down_revision: Union[str, None] = "54f2c8a91e73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DELETE FROM certificates
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY hackathon_id, user_id, type
                    ORDER BY created_at, id
                ) AS duplicate_number
                FROM certificates
            ) duplicates
            WHERE duplicate_number > 1
        )
    """)
    op.create_unique_constraint(
        "uq_certificate_recipient_type",
        "certificates",
        ["hackathon_id", "user_id", "type"],
    )
    op.create_table(
        "certificate_templates",
        sa.Column("hackathon_id", sa.UUID(), nullable=False),
        sa.Column("preset", sa.String(20), nullable=False, server_default="classic"),
        sa.Column("primary_color", sa.String(7), nullable=False, server_default="#2B0A5A"),
        sa.Column("secondary_color", sa.String(7), nullable=False, server_default="#C084FC"),
        sa.Column("heading", sa.String(120), nullable=False, server_default="Certificate of Achievement"),
        sa.Column("body_text", sa.String(300), nullable=False, server_default="This certificate is proudly presented to"),
        sa.Column("signatory_name", sa.String(120), nullable=False, server_default="Event Organizer"),
        sa.Column("signatory_title", sa.String(120), nullable=False, server_default="Hackathon Organizer"),
        sa.Column("sponsor_names", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["hackathon_id"], ["hackathons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("hackathon_id", name="uq_certificate_template_hackathon"),
    )


def downgrade() -> None:
    op.drop_table("certificate_templates")
    op.drop_constraint("uq_certificate_recipient_type", "certificates", type_="unique")
