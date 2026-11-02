import re
from datetime import date, datetime
from typing import Annotated, Literal
from urllib.parse import urlsplit
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from app.models.enums import CourseCertificate
from app.schemas.common import APIModel, ORMModel

InternshipSlug = Annotated[
    str,
    Field(min_length=2, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$"),
]
InternshipType = Literal["onsite", "remote", "hybrid"]


def _validate_internship_fields(data: dict[str, object]) -> dict[str, object]:
    slug = data.get("slug")
    if isinstance(slug, str) and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError("Slug must use lowercase letters, numbers, and hyphens")
    application_url = data.get("application_url")
    cover_image_url = data.get("cover_image_url")
    for field_name, value in (
        ("Application URL", application_url),
        ("Cover image URL", cover_image_url),
    ):
        if value is not None:
            parsed = urlsplit(str(value))
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError(
                    f"{field_name} must be an absolute HTTP or HTTPS URL"
                )
    return data


def _normalize_skills(skills: list[str] | None) -> list[str] | None:
    if skills is None:
        return None
    normalized = [skill.strip() for skill in skills]
    if any(not skill for skill in normalized):
        raise ValueError("Skills must contain non-empty strings")
    return normalized


def _validate_list_items(value: list[str] | None) -> list[str] | None:
    if value is None:
        return None
    normalized = [item.strip() for item in value]
    if any(not item for item in normalized):
        raise ValueError("Entries must be non-empty strings")
    return normalized


class InternshipCreate(APIModel):
    title: str = Field(min_length=2, max_length=160)
    slug: InternshipSlug
    short_description: str = Field(min_length=1, max_length=100)
    full_description: str = Field(min_length=1, max_length=10000)
    duration_months: int = Field(ge=1)
    eligibility: str | None = Field(default=None, max_length=10000)
    cover_image_url: str | None = Field(default=None, max_length=2048)
    skills: list[str] = Field(default_factory=list, max_length=50)
    certificates: list[CourseCertificate] = Field(default_factory=list, max_length=3)
    learning_outcomes: list[str] = Field(default_factory=list, max_length=50)
    internship_type: InternshipType | None = None
    stipend_details: str | None = Field(default=None, max_length=10000)
    start_date: date | None = None
    application_deadline: date | None = None
    positions: int | None = Field(default=None, ge=1)
    application_instructions: str | None = Field(default=None, max_length=10000)
    application_url: str | None = Field(default=None, max_length=2048)
    is_published: bool = False

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, value: list[str]) -> list[str]:
        return _normalize_skills(value) or []

    @field_validator("learning_outcomes")
    @classmethod
    def validate_learning_outcomes(cls, value: list[str]) -> list[str]:
        return _validate_list_items(value) or []

    @model_validator(mode="after")
    def validate_fields(self) -> "InternshipCreate":
        data = _validate_internship_fields(self.model_dump())
        if not self.title.strip() or not self.short_description.strip():
            raise ValueError("Title and short description cannot be blank")
        if not self.full_description.strip():
            raise ValueError("Full description cannot be blank")
        if len(set(self.certificates)) != len(self.certificates):
            raise ValueError("Certificates cannot contain duplicates")
        if data.get("start_date") and data.get("application_deadline"):
            if data["application_deadline"] < data["start_date"]:
                raise ValueError("Application deadline cannot be before the start date")
        return self


class InternshipUpdate(APIModel):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    slug: InternshipSlug | None = None
    short_description: str | None = Field(default=None, min_length=1, max_length=100)
    full_description: str | None = Field(default=None, min_length=1, max_length=10000)
    duration_months: int | None = Field(default=None, ge=1)
    eligibility: str | None = Field(default=None, max_length=10000)
    cover_image_url: str | None = Field(default=None, max_length=2048)
    skills: list[str] | None = Field(default=None, max_length=50)
    certificates: list[CourseCertificate] | None = Field(
        default=None, max_length=3
    )
    learning_outcomes: list[str] | None = Field(default=None, max_length=50)
    internship_type: InternshipType | None = None
    stipend_details: str | None = Field(default=None, max_length=10000)
    start_date: date | None = None
    application_deadline: date | None = None
    positions: int | None = Field(default=None, ge=1)
    application_instructions: str | None = Field(default=None, max_length=10000)
    application_url: str | None = Field(default=None, max_length=2048)
    is_published: bool | None = None

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, value: list[str] | None) -> list[str] | None:
        return _normalize_skills(value)

    @field_validator("learning_outcomes")
    @classmethod
    def validate_learning_outcomes(
        cls, value: list[str] | None
    ) -> list[str] | None:
        return _validate_list_items(value)

    @model_validator(mode="after")
    def validate_fields(self) -> "InternshipUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        data = self.model_dump(exclude_unset=True)
        _validate_internship_fields(data)
        for field in ("title", "short_description", "full_description"):
            if field in data and data[field] is not None and not str(data[field]).strip():
                raise ValueError(f"{field.replace('_', ' ').capitalize()} cannot be blank")
        for field in ("skills", "learning_outcomes", "certificates"):
            if field in data and data[field] is None:
                raise ValueError(
                    f"{field.replace('_', ' ').capitalize()} cannot be null; use an empty list to clear it"
                )
        if "certificates" in data and len(set(data["certificates"])) != len(
            data["certificates"]
        ):
            raise ValueError("Certificates cannot contain duplicates")
        if (
            data.get("start_date")
            and data.get("application_deadline")
            and data["application_deadline"] < data["start_date"]
        ):
            raise ValueError("Application deadline cannot be before the start date")
        return self


class InternshipRead(ORMModel):
    id: UUID
    title: str
    slug: str
    short_description: str
    full_description: str
    duration_months: int
    eligibility: str | None
    cover_image_url: str | None
    skills: list[str]
    certificates: list[CourseCertificate]
    learning_outcomes: list[str]
    internship_type: InternshipType | None
    stipend_details: str | None
    start_date: date | None
    application_deadline: date | None
    positions: int | None
    application_instructions: str | None
    application_url: str | None
    is_published: bool
    created_at: datetime
    updated_at: datetime
