"""Remove legacy integer ID columns from remaining tables.

Revision ID: 0017_remove_legacy_ids
Revises: 0016_text_arrays
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0017_remove_legacy_ids"
down_revision: Union[str, None] = "0016_text_arrays"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ("admins", "courses", "feedback", "internships")


def upgrade() -> None:
    for table_name in TABLES:
        op.drop_constraint(
            f"uq_{table_name}_legacy_id", table_name, type_="unique"
        )
        op.drop_column(table_name, "legacy_id")


def downgrade() -> None:
    for table_name in TABLES:
        op.add_column(
            table_name, sa.Column("legacy_id", sa.Integer(), nullable=True)
        )
        op.create_unique_constraint(
            f"uq_{table_name}_legacy_id", table_name, ["legacy_id"]
        )
