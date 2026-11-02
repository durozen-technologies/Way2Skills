"""Add an optional cover image URL to internships.

Revision ID: 0010_internship_cover_image
Revises: 0009_internships
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0010_internship_cover_image"
down_revision: Union[str, None] = "0009_internships"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "internships",
        sa.Column("cover_image_url", sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("internships", "cover_image_url")
