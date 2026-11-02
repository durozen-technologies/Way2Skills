"""Widen short descriptions to text without altering saved content.

Revision ID: 0007_course_content_limits
Revises: 0006_course_categories
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_course_content_limits"
down_revision: Union[str, None] = "0006_course_categories"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "courses",
        "short_description",
        existing_type=sa.String(length=300),
        type_=sa.Text(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "courses",
        "short_description",
        existing_type=sa.Text(),
        type_=sa.String(length=10000),
        existing_nullable=False,
    )
