from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from app.models.enums import ContactStatus
from app.schemas.common import APIModel, ORMModel

CONTACT_TOPICS = {
    "Full Stack Development",
    "Internship",
    "Course Fees",
    "Certificates",
    "Other Enquiry",
}


class ContactCreate(APIModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=254)
    phone: str | None = Field(default=None, max_length=30)
    topic: str | None = Field(default=None, max_length=100)
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("name", "message")
    @classmethod
    def require_nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        phone = str(value)
        if len(phone) > 30:
            raise ValueError("Phone number is too long")
        digits = "".join(character for character in phone if character.isdigit())
        if len(digits) != 10:
            raise ValueError("Phone number must contain exactly 10 digits")
        return digits

    @field_validator("topic", mode="before")
    @classmethod
    def validate_topic(cls, value: str | None) -> str | None:
        if value is None or not str(value).strip():
            return None
        topic = str(value).strip()
        if topic not in CONTACT_TOPICS:
            raise ValueError("Select a valid contact topic")
        return topic


class ContactRead(ORMModel):
    id: UUID
    name: str
    email: EmailStr
    phone: str | None
    topic: str | None
    message: str
    status: ContactStatus
    created_at: datetime
    updated_at: datetime


class ContactStatusUpdate(APIModel):
    status: ContactStatus
