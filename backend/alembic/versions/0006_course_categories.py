"""Add an archiveable registry for course categories.

Revision ID: 0006_course_categories
Revises: 0005_course_details
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_course_categories"
down_revision: Union[str, None] = "0005_course_details"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "course_categories",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("name", name="pk_course_categories"),
    )
    op.execute(
        """
        INSERT INTO course_categories (name, is_active)
        SELECT DISTINCT category, TRUE
        FROM courses
        WHERE category IS NOT NULL AND category <> ''
        """
    )


def downgrade() -> None:
    op.drop_table("course_categories")
