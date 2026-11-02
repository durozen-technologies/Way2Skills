from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.identifiers import UUIDPrimaryKeyMixin


class Internship(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "internships"
    __table_args__ = (
        CheckConstraint("duration_months > 0", name="positive_duration_months"),
        CheckConstraint(
            "positions IS NULL OR positions > 0", name="positive_positions"
        ),
        Index("ix_internships_public_order", "is_published", "created_at", "id"),
    )

    title: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    short_description: Mapped[str] = mapped_column(String(100), nullable=False)
    full_description: Mapped[str] = mapped_column(Text, nullable=False)
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    eligibility: Mapped[str | None] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(String(2048))
    skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    certificates: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    learning_outcomes: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    internship_type: Mapped[str | None] = mapped_column(String(20))
    stipend_details: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    application_deadline: Mapped[date | None] = mapped_column(Date)
    positions: Mapped[int | None] = mapped_column(Integer)
    application_instructions: Mapped[str | None] = mapped_column(Text)
    application_url: Mapped[str | None] = mapped_column(String(2048))
    is_published: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
