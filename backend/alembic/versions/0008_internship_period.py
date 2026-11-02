"""Add an optional course internship period.

Revision ID: 0008_internship_period
Revises: 0007_course_content_limits
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_internship_period"
down_revision: Union[str, None] = "0007_course_content_limits"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("internship_period", sa.Integer(), nullable=True))
    op.create_check_constraint(
        "positive_internship_period",
        "courses",
        "internship_period IS NULL OR internship_period > 0",
    )


def downgrade() -> None:
    op.drop_constraint("positive_internship_period", "courses", type_="check")
    op.drop_column("courses", "internship_period")
