from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.common import APIModel, ORMModel

FeedbackStatus = Literal["pending", "approved", "rejected"]


class FeedbackCreate(APIModel):
    student_name: str = Field(min_length=2, max_length=100)
    course: str = Field(min_length=2, max_length=180)
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=5, max_length=2000)

    @field_validator("student_name", "course", "message")
    @classmethod
    def require_nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be blank")
        return value


class FeedbackStatusUpdate(APIModel):
    status: Literal["approved", "rejected"]


class FeedbackRead(ORMModel):
    id: UUID
    student_name: str
    course: str
    rating: int
    message: str
    status: FeedbackStatus
    created_at: datetime
