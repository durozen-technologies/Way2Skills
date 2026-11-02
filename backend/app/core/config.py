from functools import lru_cache

from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str | None = None
    jwt_secret: SecretStr = SecretStr("")
    jwt_access_token_minutes: int = Field(default=30, ge=5, le=1440)
    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    environment: str = Field(default="development", validation_alias="ENV")

    @field_validator("database_url")
    @classmethod
    def postgres_only(cls, value: str | None) -> str | None:
        if value and not value.startswith(("postgresql://", "postgresql+psycopg://")):
            raise ValueError("DATABASE_URL must use PostgreSQL with the psycopg driver")
        if value and value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @field_validator("frontend_origins")
    @classmethod
    def validate_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins or "*" in origins:
            raise ValueError("FRONTEND_ORIGINS must contain explicit origins, not a wildcard")
        for origin in origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
                or parsed.username
                or parsed.password
            ):
                raise ValueError("Each frontend origin must be an exact HTTP(S) origin")
        return ",".join(origins)

    def allowed_origins(self) -> list[str]:
        return self.frontend_origins.split(",")

    def signing_key(self) -> str:
        value = self.jwt_secret.get_secret_value()
        if len(value) < 32 or value.startswith("replace-"):
            raise RuntimeError("JWT_SECRET must contain at least 32 characters")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
