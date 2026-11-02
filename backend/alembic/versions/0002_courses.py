"""Add persistent course catalogue.

Revision ID: 0002_courses
Revises: 0001_initial
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_courses"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("short_description", sa.String(length=300), nullable=False),
        sa.Column("full_description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("course_type", sa.String(length=20), nullable=False),
        sa.Column("duration", sa.String(length=80), nullable=False),
        sa.Column("level", sa.String(length=40), nullable=False),
        sa.Column("delivery_mode", sa.String(length=40), nullable=False),
        sa.Column("image_url", sa.String(length=2048), nullable=True),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("syllabus", sa.JSON(), nullable=False),
        sa.Column("card_theme", sa.String(length=20), nullable=True),
        sa.Column("is_published", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("price IS NULL OR price >= 0", name="nonnegative_price"),
        sa.CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        sa.CheckConstraint(
            "course_type IN ('course', 'internship', 'programme')",
            name="valid_course_type",
        ),
        sa.CheckConstraint(
            "card_theme IS NULL OR card_theme IN ('sky', 'mint', 'amber', 'violet')",
            name="valid_card_theme",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_courses")),
        sa.UniqueConstraint("slug", name=op.f("uq_courses_slug")),
    )
    op.create_index("ix_courses_slug", "courses", ["slug"], unique=True)
    op.create_index("ix_courses_course_type", "courses", ["course_type"], unique=False)
    op.create_index("ix_courses_is_published", "courses", ["is_published"], unique=False)
    op.create_index("ix_courses_public_order", "courses", ["is_published", "display_order", "id"])
    op.create_index(
        "ix_courses_type_published_order",
        "courses",
        ["course_type", "is_published", "display_order"],
    )
    op.create_index("ix_courses_category", "courses", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_courses_category", table_name="courses")
    op.drop_index("ix_courses_type_published_order", table_name="courses")
    op.drop_index("ix_courses_public_order", table_name="courses")
    op.drop_index("ix_courses_is_published", table_name="courses")
    op.drop_index("ix_courses_course_type", table_name="courses")
    op.drop_index("ix_courses_slug", table_name="courses")
    op.drop_table("courses")
