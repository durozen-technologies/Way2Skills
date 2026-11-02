"""Add persistent student feedback.

Revision ID: 0004_student_feedback
Revises: 0003_uuid_primary_keys
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_student_feedback"
down_revision: Union[str, None] = "0003_uuid_primary_keys"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "feedback",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("legacy_id", sa.Integer(), nullable=True),
        sa.Column("student_name", sa.String(length=100), nullable=False),
        sa.Column("course", sa.String(length=180), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_feedback_valid_rating"),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_feedback_valid_status",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_feedback"),
        sa.UniqueConstraint("legacy_id", name="uq_feedback_legacy_id"),
    )
    op.create_index(
        "ix_feedback_status_created_at", "feedback", ["status", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_feedback_status_created_at", table_name="feedback")
    op.drop_table("feedback")
