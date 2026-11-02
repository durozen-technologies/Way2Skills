from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CourseCategory(Base):
    __tablename__ = "course_categories"

    name: Mapped[str] = mapped_column(String(80), primary_key=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
