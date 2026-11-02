from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.identifiers import UUIDPrimaryKeyMixin


class Feedback(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="valid_rating"),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="valid_status",
        ),
        Index("ix_feedback_status_created_at", "status", "created_at"),
    )

    student_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course: Mapped[str] = mapped_column(String(180), nullable=False)
    rating: Mapped[int] = mapped_column(nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
