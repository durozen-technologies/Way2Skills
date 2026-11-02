from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import ContactStatus
from app.models.identifiers import UUIDPrimaryKeyMixin


class Contact(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "contacts"
    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'in_progress', 'resolved')", name="valid_status"
        ),
        Index("ix_contacts_created_at", "created_at"),
        Index("ix_contacts_status_created_at", "status", "created_at"),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    topic: Mapped[str | None] = mapped_column(String(100))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ContactStatus.NEW,
        server_default=ContactStatus.NEW.value,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
