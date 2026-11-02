from app.core.config import get_settings
from app.core.security import create_access_token


def test_admin_login_success_and_me(client, admin_account):
    test_client, _ = client
    response = test_client.post(
        "/api/auth/login",
        json={"email": "ADMIN@example.com", "password": "Secure-Admin-Password-123"},
    )

    assert response.status_code == 200
    token = response.json()["access_token"]
    profile = test_client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert profile.status_code == 200
    assert profile.json()["email"] == "admin@example.com"
    assert "password_hash" not in profile.json()


def test_legacy_integer_admin_tokens_remain_supported(client, admin_account):
    test_client, testing_session = client
    with testing_session() as session:
        from app.models.admin import Admin

        admin = session.get(Admin, admin_account)
        assert admin is not None
        admin.legacy_id = 29
        session.commit()

    token, _ = create_access_token("29", get_settings())
    profile = test_client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert profile.status_code == 200
    assert profile.json()["id"] == str(admin_account)


def test_admin_login_failure_is_generic(client, admin_account):
    test_client, _ = client
    response = test_client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_is_rate_limited(client, admin_account):
    test_client, _ = client
    for _ in range(5):
        response = test_client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "wrong-password"},
        )
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"


def test_admin_endpoints_reject_missing_or_invalid_token(client):
    test_client, _ = client
    assert test_client.get("/api/admin/dashboard").status_code == 401
    assert test_client.get(
        "/api/admin/dashboard",
        headers={"Authorization": "Bearer invalid-token"},
    ).status_code == 401


def test_inactive_admin_token_is_rejected(client, admin_account, admin_token):
    test_client, testing_session = client
    from app.models.admin import Admin

    with testing_session() as session:
        admin = session.get(Admin, admin_account)
        assert admin is not None
        admin.is_active = False
        session.commit()

    response = test_client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 401
