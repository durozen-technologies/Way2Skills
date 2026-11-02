"""Add persistent course curriculum, benefits, and certificate selections.

Revision ID: 0005_course_details
Revises: 0004_student_feedback
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_course_details"
down_revision: Union[str, None] = "0004_student_feedback"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("curriculum", sa.Text(), nullable=True))
    op.add_column("courses", sa.Column("benefits", sa.Text(), nullable=True))
    op.add_column(
        "courses",
        sa.Column(
            "certificates",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("courses", "certificates")
    op.drop_column("courses", "benefits")
    op.drop_column("courses", "curriculum")
