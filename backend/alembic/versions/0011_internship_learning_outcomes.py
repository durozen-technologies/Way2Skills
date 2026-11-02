"""Add learning outcomes to internship records.

Revision ID: 0011_internship_outcomes
Revises: 0010_internship_cover_image
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0011_internship_outcomes"
down_revision: Union[str, None] = "0010_internship_cover_image"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "internships",
        sa.Column(
            "learning_outcomes",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("internships", "learning_outcomes")
