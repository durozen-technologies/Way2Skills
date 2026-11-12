"""Convert course and internship string lists to PostgreSQL text arrays.

Revision ID: 0016_course_and_internship_text_arrays
Revises: 0015_remove_contact_legacy_id
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0016_text_arrays"
down_revision: Union[str, None] = "0015_remove_contact_legacy_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ARRAY_COLUMNS = {
    "courses": ("certificates", "syllabus"),
    "internships": ("skills", "certificates", "learning_outcomes"),
}
DEFAULTED_COLUMNS = {
    ("courses", "certificates"),
    ("internships", "certificates"),
    ("internships", "learning_outcomes"),
}


def upgrade() -> None:
    for table_name, columns in ARRAY_COLUMNS.items():
        for column_name in columns:
            op.alter_column(
                table_name,
                column_name,
                existing_type=sa.JSON(),
                server_default=None,
            )

    op.execute(
        """
        CREATE FUNCTION json_text_array_to_text_array(json_value json)
        RETURNS text[]
        LANGUAGE SQL
        IMMUTABLE
        STRICT
        AS $$
            SELECT COALESCE(
                array_agg(value ORDER BY ordinality),
                ARRAY[]::text[]
            )
            FROM json_array_elements_text(json_value)
                WITH ORDINALITY AS elements(value, ordinality)
        $$
        """
    )
    for table_name, columns in ARRAY_COLUMNS.items():
        for column_name in columns:
            op.alter_column(
                table_name,
                column_name,
                existing_type=sa.JSON(),
                type_=postgresql.ARRAY(sa.Text()),
                postgresql_using=f"json_text_array_to_text_array({column_name})",
            )
            if (table_name, column_name) in DEFAULTED_COLUMNS:
                op.alter_column(
                    table_name,
                    column_name,
                    existing_type=postgresql.ARRAY(sa.Text()),
                    server_default=sa.text("ARRAY[]::text[]"),
                )
    op.execute("DROP FUNCTION json_text_array_to_text_array(json)")


def downgrade() -> None:
    for table_name, columns in ARRAY_COLUMNS.items():
        for column_name in columns:
            op.alter_column(
                table_name,
                column_name,
                existing_type=postgresql.ARRAY(sa.Text()),
                server_default=None,
            )
            op.alter_column(
                table_name,
                column_name,
                existing_type=postgresql.ARRAY(sa.Text()),
                type_=sa.JSON(),
                postgresql_using=f"to_json({column_name})",
            )
            if (table_name, column_name) in DEFAULTED_COLUMNS:
                op.alter_column(
                    table_name,
                    column_name,
                    existing_type=sa.JSON(),
                    server_default=sa.text("'[]'::json"),
                )
