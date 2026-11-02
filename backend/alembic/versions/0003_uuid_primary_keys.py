"""Convert entity primary keys to UUIDs while retaining legacy IDs.

Revision ID: 0003_uuid_primary_keys
Revises: 0002_courses
"""

from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision: str = "0003_uuid_primary_keys"
down_revision: Union[str, None] = "0002_courses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ("admins", "contacts", "admissions", "courses")


def upgrade() -> None:
    connection = op.get_bind()
    for table_name in TABLES:
        op.add_column(table_name, sa.Column("legacy_id", sa.Integer(), nullable=True))
        op.add_column(table_name, sa.Column("uuid_id", sa.Uuid(as_uuid=True), nullable=True))

        table = sa.table(
            table_name,
            sa.column("id", sa.Integer()),
            sa.column("legacy_id", sa.Integer()),
            sa.column("uuid_id", sa.Uuid(as_uuid=True)),
        )
        old_ids = connection.execute(sa.select(table.c.id)).scalars().all()
        for old_id in old_ids:
            connection.execute(
                sa.update(table)
                .where(table.c.id == old_id)
                .values(legacy_id=old_id, uuid_id=uuid4())
            )

        op.alter_column(table_name, "uuid_id", nullable=False)
        op.create_unique_constraint(f"uq_{table_name}_legacy_id", table_name, ["legacy_id"])
        if table_name == "courses":
            op.drop_index("ix_courses_public_order", table_name="courses")
        op.drop_constraint(f"pk_{table_name}", table_name, type_="primary")
        op.drop_column(table_name, "id")
        op.alter_column(table_name, "uuid_id", new_column_name="id")
        op.create_primary_key(f"pk_{table_name}", table_name, ["id"])
        if table_name == "courses":
            op.create_index(
                "ix_courses_public_order",
                "courses",
                ["is_published", "display_order", "id"],
            )


def downgrade() -> None:
    connection = op.get_bind()
    for table_name in TABLES:
        table = sa.table(
            table_name,
            sa.column("legacy_id", sa.Integer()),
        )
        missing_legacy_ids = connection.scalar(
            sa.select(sa.func.count()).select_from(table).where(table.c.legacy_id.is_(None))
        )
        if missing_legacy_ids:
            raise RuntimeError(
                f"Cannot downgrade {table_name}: rows created after the UUID migration "
                "do not have legacy integer IDs."
            )

    for table_name in reversed(TABLES):
        if table_name == "courses":
            op.drop_index("ix_courses_public_order", table_name="courses")
        op.drop_constraint(f"pk_{table_name}", table_name, type_="primary")
        op.drop_constraint(f"uq_{table_name}_legacy_id", table_name, type_="unique")
        op.drop_column(table_name, "id")
        op.alter_column(table_name, "legacy_id", nullable=False, new_column_name="id")
        op.create_primary_key(f"pk_{table_name}", table_name, ["id"])
        if table_name == "courses":
            op.create_index(
                "ix_courses_public_order",
                "courses",
                ["is_published", "display_order", "id"],
            )
        sequence_name = f"{table_name}_id_seq"
        op.execute(sa.text(f'CREATE SEQUENCE "{sequence_name}"'))
        op.execute(
            sa.text(
                f'ALTER TABLE "{table_name}" ALTER COLUMN id '
                f"SET DEFAULT nextval('\"{sequence_name}\"')"
            )
        )
        op.execute(
            sa.text(
                f'ALTER SEQUENCE "{sequence_name}" OWNED BY "{table_name}".id'
            )
        )
        op.execute(
            sa.text(
                f'SELECT setval(\'"{sequence_name}"\', COALESCE(MAX(id), 1), '
                f'MAX(id) IS NOT NULL) FROM "{table_name}"'
            )
        )
