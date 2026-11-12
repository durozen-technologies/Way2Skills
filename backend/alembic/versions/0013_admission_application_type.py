"""Track admission offering types.

Revision ID: 0013_admission_application_type
Revises: 0012_internship_certificates
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0013_admission_application_type"
down_revision: Union[str, None] = "0012_internship_certificates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admissions",
        sa.Column(
            "application_type",
            sa.String(length=20),
            server_default="course",
            nullable=False,
        ),
    )
    op.alter_column(
        "admissions",
        "course",
        existing_type=sa.String(length=100),
        type_=sa.String(length=180),
        existing_nullable=False,
    )
    op.create_check_constraint(
        "valid_application_type",
        "admissions",
        "application_type IN ('course', 'internship', 'programme')",
    )
    op.execute(
        """
        UPDATE admissions
        SET application_type = courses.course_type
        FROM courses
        WHERE admissions.course = courses.slug
          AND courses.course_type IN ('course', 'programme')
        """
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_admissions_valid_application_type", "admissions", type_="check"
    )
    op.drop_column("admissions", "application_type")
    op.alter_column(
        "admissions",
        "course",
        existing_type=sa.String(length=180),
        type_=sa.String(length=100),
        existing_nullable=False,
    )
