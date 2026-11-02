from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import APIModel


class LoginRequest(APIModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class TokenResponse(APIModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AdminMe(APIModel):
    id: UUID
    email: EmailStr
    is_active: bool
