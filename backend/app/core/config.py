from functools import lru_cache

from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    db_host: str | None = None
    db_port: int = Field(default=5432, ge=1, le=65535)
    db_name: str | None = None
    db_user: str | None = None
    db_password: SecretStr | None = None
    way2skills_apps_script_web_app_url: str | None = None
    jwt_secret: SecretStr = SecretStr("")
    jwt_access_token_minutes: int = Field(default=30, ge=5, le=1440)
    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    environment: str = Field(default="development", validation_alias="ENV")

    @field_validator("way2skills_apps_script_web_app_url")
    @classmethod
    def validate_apps_script_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        parsed = urlsplit(value)
        if (
            parsed.scheme != "https"
            or parsed.hostname != "script.google.com"
            or parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or not parsed.path.startswith("/macros/s/")
            or not parsed.path.endswith("/exec")
        ):
            raise ValueError(
                "WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL must be an HTTPS Google Apps Script URL"
            )
        return value.strip()

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

    @property
    def database_url(self) -> URL | None:
        if not all((self.db_host, self.db_name, self.db_user, self.db_password)):
            return None
        if not all((self.db_host.strip(), self.db_name.strip(), self.db_user.strip())):
            return None
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.db_user,
            password=self.db_password.get_secret_value(),
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
