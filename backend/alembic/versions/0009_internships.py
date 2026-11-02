"""Create a separate internship catalogue.

Revision ID: 0009_internships
Revises: 0008_internship_period
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0009_internships"
down_revision: Union[str, None] = "0008_internship_period"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "internships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("legacy_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("short_description", sa.String(length=100), nullable=False),
        sa.Column("full_description", sa.Text(), nullable=False),
        sa.Column("duration_months", sa.Integer(), nullable=False),
        sa.Column("eligibility", sa.Text(), nullable=True),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("internship_type", sa.String(length=20), nullable=True),
        sa.Column("stipend_details", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("application_deadline", sa.Date(), nullable=True),
        sa.Column("positions", sa.Integer(), nullable=True),
        sa.Column("application_instructions", sa.Text(), nullable=True),
        sa.Column("application_url", sa.String(length=2048), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "duration_months > 0", name="ck_internships_positive_duration_months"
        ),
        sa.CheckConstraint(
            "positions IS NULL OR positions > 0",
            name="ck_internships_positive_positions",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_internships"),
        sa.UniqueConstraint("legacy_id", name="uq_internships_legacy_id"),
        sa.UniqueConstraint("slug", name="uq_internships_slug"),
    )
    op.create_index(
        "ix_internships_is_published", "internships", ["is_published"], unique=False
    )
    op.create_index(
        "ix_internships_public_order",
        "internships",
        ["is_published", "created_at", "id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_internships_public_order", table_name="internships")
    op.drop_index("ix_internships_is_published", table_name="internships")
    op.drop_table("internships")
