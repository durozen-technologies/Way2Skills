from sqlalchemy.exc import OperationalError

from app.db.session import get_session


def test_health_reports_database_connectivity(client):
    test_client, _ = client
    response = test_client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_health_reports_unavailable_database(client):
    test_client, _ = client

    class UnavailableSession:
        def execute(self, statement):
            raise OperationalError("SELECT 1", {}, RuntimeError("database unavailable"))

    def override_unavailable_session():
        yield UnavailableSession()

    from app.main import app

    app.dependency_overrides[get_session] = override_unavailable_session
    response = test_client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "database": "disconnected"}
