import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


@pytest.mark.parametrize(
    ("environment", "documentation_enabled"),
    [
        ("development", True),
        ("staging", True),
        ("production", False),
    ],
)
def test_documentation_routes_follow_environment(
    monkeypatch: pytest.MonkeyPatch,
    environment: str,
    documentation_enabled: bool,
):
    monkeypatch.setenv("ENV", environment)
    get_settings.cache_clear()

    application = create_app()
    with TestClient(application) as client:
        expected_status = 200 if documentation_enabled else 404
        for path in ("/docs", "/redoc", "/openapi.json"):
            assert client.get(path).status_code == expected_status

    registered_routes = {route.path for route in application.routes}
    assert "/api/health" in registered_routes
    assert "/api/auth/login" in registered_routes

    get_settings.cache_clear()
