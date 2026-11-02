import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.models import Admin, Course
from app.api.routes import auth as auth_routes


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET", "test-signing-secret-that-is-at-least-32-characters")
    get_settings.cache_clear()
    auth_routes._failed_logins.clear()
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_session():
        with testing_session() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client, testing_session
    app.dependency_overrides.clear()
    engine.dispose()
    auth_routes._failed_logins.clear()
    get_settings.cache_clear()


@pytest.fixture
def admin_account(client):
    _, testing_session = client
    with testing_session() as session:
        admin = Admin(
            email="admin@example.com",
            password_hash=hash_password("Secure-Admin-Password-123"),
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        return admin.id


@pytest.fixture
def admin_token(client, admin_account):
    test_client, _ = client
    response = test_client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "Secure-Admin-Password-123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def published_course(client):
    _, testing_session = client
    with testing_session() as session:
        course = Course(
            title="Full Stack Development",
            slug="full-stack-development",
            short_description="Learn to build web applications.",
            full_description="A published development programme.",
            category="Development",
            course_type="programme",
            duration="4 months",
            level="Beginner",
            delivery_mode="Online",
            syllabus=["Frontend fundamentals", "Backend fundamentals"],
            is_published=True,
            display_order=0,
        )
        session.add(course)
        session.commit()
        session.refresh(course)
        return course.id
