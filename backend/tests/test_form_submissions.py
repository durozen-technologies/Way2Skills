from urllib.parse import urlencode

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.api.routes import form_submissions


@pytest.fixture
def configured_apps_script(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv(
        "WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL",
        "https://script.google.com/macros/s/test-deployment/exec",
    )
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_form_submission_is_relayed_to_backend_configured_url(
    configured_apps_script,
    monkeypatch: pytest.MonkeyPatch,
):
    forwarded = {}

    class MockClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, data):
            forwarded["url"] = url
            forwarded["data"] = data
            return httpx.Response(
                200,
                text="<script>window.top.postMessage({}, 'http://localhost:3000');</script>",
                headers={"content-type": "text/html; charset=utf-8"},
            )

    monkeypatch.setattr(form_submissions.httpx, "AsyncClient", MockClient)
    fields = {
        "payload": '{"formType":"contact","name":"Test"}',
        "requestId": "c1b6d309-3c45-4fc6-9ecb-79bca3d8dad7",
        "responseOrigin": "http://localhost:3000",
    }

    with TestClient(app) as client:
        response = client.post(
            "/api/form-submissions",
            content=urlencode(fields),
            headers={"content-type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["cache-control"] == "no-store"
    assert forwarded["url"] == (
        "https://script.google.com/macros/s/test-deployment/exec"
    )
    assert forwarded["data"] == fields


def test_form_submission_rejects_unapproved_response_origin(
    configured_apps_script,
    monkeypatch: pytest.MonkeyPatch,
):
    def unexpected_client(*args, **kwargs):
        pytest.fail("The Apps Script endpoint must not be called")

    monkeypatch.setattr(form_submissions.httpx, "AsyncClient", unexpected_client)
    fields = {
        "payload": '{"formType":"contact"}',
        "requestId": "c1b6d309-3c45-4fc6-9ecb-79bca3d8dad7",
        "responseOrigin": "https://unapproved.example",
    }

    with TestClient(app) as client:
        response = client.post(
            "/api/form-submissions",
            content=urlencode(fields),
            headers={"content-type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 400
