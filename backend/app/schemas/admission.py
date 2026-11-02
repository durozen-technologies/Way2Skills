from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from app.models.enums import AdmissionStatus
from app.schemas.common import APIModel, ORMModel


class AdmissionCreate(APIModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=254)
    phone: str = Field(min_length=10, max_length=10)
    education: Literal["school", "diploma", "undergraduate", "graduate", "other"]
    course: str = Field(
        min_length=2,
        max_length=180,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    message: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def require_nonblank_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Name cannot be blank")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        phone = str(value)
        if len(phone) > 30:
            raise ValueError("Phone number is too long")
        digits = "".join(character for character in phone if character.isdigit())
        if len(digits) != 10:
            raise ValueError("Phone number must contain exactly 10 digits")
        return digits

    @field_validator("message", mode="before")
    @classmethod
    def normalize_message(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        return str(value).strip()


class AdmissionRead(ORMModel):
    id: UUID
    name: str
    email: EmailStr
    phone: str
    education: str
    course: str
    message: str | None
    status: AdmissionStatus
    created_at: datetime
    updated_at: datetime


class AdmissionStatusUpdate(APIModel):
    status: AdmissionStatus
