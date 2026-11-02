from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import AdmissionStatus
from app.models.identifiers import UUIDPrimaryKeyMixin


class Admission(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "admissions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'in_progress', 'accepted', 'rejected')",
            name="valid_status",
        ),
        Index("ix_admissions_created_at", "created_at"),
        Index("ix_admissions_status_created_at", "status", "created_at"),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(10), nullable=False)
    education: Mapped[str] = mapped_column(String(30), nullable=False)
    course: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=AdmissionStatus.PENDING,
        server_default=AdmissionStatus.PENDING.value,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
