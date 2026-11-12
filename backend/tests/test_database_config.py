import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_database_url_uses_individual_env_settings_and_encodes_password(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("DB_HOST", "db.example.test")
    monkeypatch.setenv("DB_PORT", "5433")
    monkeypatch.setenv("DB_NAME", "way2skills")
    monkeypatch.setenv("DB_USER", "app-user")
    monkeypatch.setenv("DB_PASSWORD", "password/with:special@characters")
    settings = Settings(_env_file=None)

    database_url = settings.database_url

    assert database_url is not None
    assert database_url.drivername == "postgresql+psycopg"
    assert database_url.host == "db.example.test"
    assert database_url.port == 5433
    assert database_url.database == "way2skills"
    assert database_url.username == "app-user"
    assert database_url.password == "password/with:special@characters"
    assert "%2F" in database_url.render_as_string(hide_password=False)


def test_database_url_is_unavailable_when_a_setting_is_missing(
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("DB_HOST", "localhost")
    monkeypatch.setenv("DB_NAME", "way2skills")
    monkeypatch.setenv("DB_USER", "way2skills")
    monkeypatch.delenv("DB_PASSWORD", raising=False)
    settings = Settings(_env_file=None)

    assert settings.database_url is None


def test_apps_script_url_rejects_non_google_hosts():
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            way2skills_apps_script_web_app_url=(
                "https://attacker.example/macros/s/deployment/exec"
            ),
        )


@pytest.mark.parametrize(
    "raw_url",
    [
        'https://script.google.com/macros/s/AKfycb...Ba_1NovUQZj9eVl/exec%22',
        'https://script.google.com/macros/s/AKfycb...Ba_1NovUQZj9eVl/exec"',
        '"https://script.google.com/macros/s/AKfycb...Ba_1NovUQZj9eVl/exec"',
        "'https://script.google.com/macros/s/AKfycb...Ba_1NovUQZj9eVl/exec'",
        "https://script.google.com/macros/s/AKfycb...Ba_1NovUQZj9eVl/exec",
    ],
)
def test_apps_script_url_normalizes_quotes_and_encoded_quotes(raw_url: str):
    settings = Settings(
        _env_file=None,
        way2skills_apps_script_web_app_url=raw_url,
    )
    assert (
        settings.way2skills_apps_script_web_app_url
        == "https://script.google.com/macros/s/AKfycb...Ba_1NovUQZj9eVl/exec"
    )
