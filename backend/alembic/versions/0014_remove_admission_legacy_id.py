"""Remove legacy integer IDs from admissions.

Revision ID: 0014_remove_admission_legacy_id
Revises: 0013_admission_application_type
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0014_remove_admission_legacy_id"
down_revision: Union[str, None] = "0013_admission_application_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("uq_admissions_legacy_id", "admissions", type_="unique")
    op.drop_column("admissions", "legacy_id")


def downgrade() -> None:
    op.add_column(
        "admissions",
        sa.Column("legacy_id", sa.Integer(), nullable=True),
    )
    op.create_unique_constraint(
        "uq_admissions_legacy_id", "admissions", ["legacy_id"]
    )
