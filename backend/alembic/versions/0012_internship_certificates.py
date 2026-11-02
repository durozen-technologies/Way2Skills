"""Add certificates to internship records.

Revision ID: 0012_internship_certificates
Revises: 0011_internship_outcomes
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0012_internship_certificates"
down_revision: Union[str, None] = "0011_internship_outcomes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "internships",
        sa.Column(
            "certificates",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("internships", "certificates")
