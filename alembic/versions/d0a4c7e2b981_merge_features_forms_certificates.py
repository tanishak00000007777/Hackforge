"""merge feature flags with forms and certificate work

Revision ID: d0a4c7e2b981
Revises: 0018b1c0e350, 8c5f7c8d9e10
"""
from typing import Sequence, Union


revision: str = "d0a4c7e2b981"
down_revision: Union[str, tuple[str, str], None] = (
    "0018b1c0e350",
    "8c5f7c8d9e10",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
