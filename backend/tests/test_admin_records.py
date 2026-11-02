from uuid import UUID

from app.models.admission import Admission
from app.models.contact import Contact

CONTACT = {
    "name": "Taylor Student",
    "email": "taylor@example.com",
    "phone": "1234567890",
    "topic": "Full Stack Development",
    "message": "I would like course information.",
}
ADMISSION = {
    "name": "Jordan Applicant",
    "email": "jordan@example.com",
    "phone": "9876543210",
    "education": "undergraduate",
    "course": "full-stack-development",
    "message": "Please contact me.",
}


def test_dashboard_and_contact_status_search_pagination(client, auth_headers):
    test_client, testing_session = client
    first = test_client.post("/api/contact", json=CONTACT).json()
    test_client.post(
        "/api/contact",
        json={**CONTACT, "name": "Alex Learner", "email": "alex@example.com"},
    )
    updated = test_client.patch(
        f"/api/admin/contacts/{first['id']}",
        headers=auth_headers,
        json={"status": "in_progress"},
    )

    assert updated.status_code == 200
    assert updated.json()["status"] == "in_progress"
    listing = test_client.get(
        "/api/admin/contacts",
        headers=auth_headers,
        params={"search": "Taylor", "status": "in_progress", "limit": 1, "offset": 0},
    )
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert len(listing.json()["items"]) == 1
    assert listing.json()["items"][0]["name"] == "Taylor Student"
    first_page = test_client.get(
        "/api/admin/contacts",
        headers=auth_headers,
        params={"limit": 1, "offset": 0},
    )
    second_page = test_client.get(
        "/api/admin/contacts",
        headers=auth_headers,
        params={"limit": 1, "offset": 1},
    )
    assert second_page.json()["total"] == 2
    assert {
        first_page.json()["items"][0]["name"],
        second_page.json()["items"][0]["name"],
    } == {"Taylor Student", "Alex Learner"}

    dashboard = test_client.get("/api/admin/dashboard", headers=auth_headers)
    assert dashboard.json()["contacts_total"] == 2
    assert dashboard.json()["contacts_new"] == 1
    with testing_session() as session:
        assert session.get(Contact, UUID(first["id"])).status == "in_progress"


def test_admission_status_filter_update_and_pagination(
    client, auth_headers, published_course
):
    test_client, testing_session = client
    first = test_client.post("/api/admissions", json=ADMISSION).json()
    test_client.post(
        "/api/admissions",
        json={**ADMISSION, "name": "Casey Applicant", "email": "casey@example.com"},
    )
    updated = test_client.patch(
        f"/api/admin/admissions/{first['id']}",
        headers=auth_headers,
        json={"status": "accepted"},
    )
    assert updated.status_code == 200
    listing = test_client.get(
        "/api/admin/admissions",
        headers=auth_headers,
        params={"status": "accepted", "limit": 1},
    )
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["status"] == "accepted"
    first_page = test_client.get(
        "/api/admin/admissions",
        headers=auth_headers,
        params={"limit": 1, "offset": 0},
    )
    second_page = test_client.get(
        "/api/admin/admissions",
        headers=auth_headers,
        params={"limit": 1, "offset": 1},
    )
    assert second_page.json()["total"] == 2
    assert {
        first_page.json()["items"][0]["status"],
        second_page.json()["items"][0]["status"],
    } == {"accepted", "pending"}
    dashboard = test_client.get("/api/admin/dashboard", headers=auth_headers)
    assert dashboard.json()["admissions_total"] == 2
    assert dashboard.json()["admissions_pending"] == 1
    with testing_session() as session:
        assert session.get(Admission, UUID(first["id"])).status == "accepted"


def test_admin_list_rejects_invalid_filters_and_pagination(client, auth_headers):
    test_client, _ = client
    invalid_status = test_client.get(
        "/api/admin/contacts", headers=auth_headers, params={"status": "closed"}
    )
    invalid_page = test_client.get(
        "/api/admin/admissions", headers=auth_headers, params={"limit": 101}
    )

    assert invalid_status.status_code == 422
    assert invalid_page.status_code == 422


def test_admin_detail_returns_not_found(client, auth_headers):
    test_client, _ = client
    assert test_client.get(
        "/api/admin/contacts/999", headers=auth_headers
    ).status_code == 404
    assert test_client.get(
        "/api/admin/admissions/999", headers=auth_headers
    ).status_code == 404


def test_legacy_integer_record_paths_remain_supported(client, auth_headers):
    test_client, testing_session = client
    with testing_session() as session:
        session.add(
            Contact(
                legacy_id=73,
                name="Legacy Contact",
                email="legacy@example.com",
                message="Existing record",
            )
        )
        session.commit()

    response = test_client.patch(
        "/api/admin/contacts/73",
        headers=auth_headers,
        json={"status": "resolved"},
    )
    assert response.status_code == 200
    assert response.json()["id"] != "73"
    assert response.json()["status"] == "resolved"
