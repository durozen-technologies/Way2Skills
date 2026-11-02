"""Create contact, admission, and admin tables.

Revision ID: 0001_initial
Revises:
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admins")),
    )
    op.create_index(op.f("ix_admins_email"), "admins", ["email"], unique=True)

    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("topic", sa.String(length=100), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="new", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('new', 'in_progress', 'resolved')",
            name=op.f("ck_contacts_valid_status"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contacts")),
    )
    op.create_index(op.f("ix_contacts_email"), "contacts", ["email"], unique=False)
    op.create_index(op.f("ix_contacts_status"), "contacts", ["status"], unique=False)
    op.create_index("ix_contacts_created_at", "contacts", ["created_at"], unique=False)
    op.create_index(
        "ix_contacts_status_created_at", "contacts", ["status", "created_at"], unique=False
    )

    op.create_table(
        "admissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=10), nullable=False),
        sa.Column("education", sa.String(length=30), nullable=False),
        sa.Column("course", sa.String(length=100), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'in_progress', 'accepted', 'rejected')",
            name=op.f("ck_admissions_valid_status"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admissions")),
    )
    op.create_index(op.f("ix_admissions_email"), "admissions", ["email"], unique=False)
    op.create_index(op.f("ix_admissions_status"), "admissions", ["status"], unique=False)
    op.create_index("ix_admissions_created_at", "admissions", ["created_at"], unique=False)
    op.create_index(
        "ix_admissions_status_created_at", "admissions", ["status", "created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_admissions_status_created_at", table_name="admissions")
    op.drop_index("ix_admissions_created_at", table_name="admissions")
    op.drop_index(op.f("ix_admissions_status"), table_name="admissions")
    op.drop_index(op.f("ix_admissions_email"), table_name="admissions")
    op.drop_table("admissions")
    op.drop_index("ix_contacts_status_created_at", table_name="contacts")
    op.drop_index("ix_contacts_created_at", table_name="contacts")
    op.drop_index(op.f("ix_contacts_status"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_email"), table_name="contacts")
    op.drop_table("contacts")
    op.drop_index(op.f("ix_admins_email"), table_name="admins")
    op.drop_table("admins")
