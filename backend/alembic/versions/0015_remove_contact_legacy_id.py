"""Remove legacy integer IDs from contacts.

Revision ID: 0015_remove_contact_legacy_id
Revises: 0014_remove_admission_legacy_id
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0015_remove_contact_legacy_id"
down_revision: Union[str, None] = "0014_remove_admission_legacy_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("uq_contacts_legacy_id", "contacts", type_="unique")
    op.drop_column("contacts", "legacy_id")


def downgrade() -> None:
    op.add_column(
        "contacts",
        sa.Column("legacy_id", sa.Integer(), nullable=True),
    )
    op.create_unique_constraint("uq_contacts_legacy_id", "contacts", ["legacy_id"])
