from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.identifiers import UUIDPrimaryKeyMixin


class Course(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("price IS NULL OR price >= 0", name="nonnegative_price"),
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        CheckConstraint(
            "internship_period IS NULL OR internship_period > 0",
            name="positive_internship_period",
        ),
        CheckConstraint(
            "course_type IN ('course', 'internship', 'programme')",
            name="valid_course_type",
        ),
        CheckConstraint(
            "card_theme IS NULL OR card_theme IN ('sky', 'mint', 'amber', 'violet')",
            name="valid_card_theme",
        ),
        Index("ix_courses_public_order", "is_published", "display_order", "id"),
        Index("ix_courses_type_published_order", "course_type", "is_published", "display_order"),
        Index("ix_courses_category", "category"),
    )

    title: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    full_description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    course_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    duration: Mapped[str] = mapped_column(String(80), nullable=False)
    internship_period: Mapped[int | None] = mapped_column(Integer)

    @property
    def internship_duration_months(self) -> int | None:
        return self.internship_period

    @internship_duration_months.setter
    def internship_duration_months(self, value: int | None) -> None:
        self.internship_period = value

    level: Mapped[str] = mapped_column(String(40), nullable=False)
    delivery_mode: Mapped[str] = mapped_column(String(40), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(2048))
    price: Mapped[float | None] = mapped_column(Numeric(10, 2))
    curriculum: Mapped[str | None] = mapped_column(Text)
    benefits: Mapped[str | None] = mapped_column(Text)
    certificates: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    syllabus: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    card_theme: Mapped[str | None] = mapped_column(String(20))
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
