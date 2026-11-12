from uuid import UUID

from app.models.admin import Admin
from app.models.admission import Admission
from app.models.course import Course
from app.models.contact import Contact
from app.models.feedback import Feedback
from app.models.internship import Internship

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
        assert "legacy_id" not in Admission.__table__.c


def test_admission_sections_separate_internships_and_include_programmes(
    client, auth_headers, published_course
):
    test_client, testing_session = client
    with testing_session() as session:
        session.add(
            Internship(
                title="Python Internship",
                slug="python-internship",
                short_description="Build practical Python skills.",
                full_description="A published Python internship.",
                duration_months=3,
                is_published=True,
            )
        )
        session.commit()
    programme_application = test_client.post(
        "/api/admissions", json=ADMISSION
    ).json()
    internship_application = test_client.post(
        "/api/admissions",
        json={
            **ADMISSION,
            "email": "intern@example.com",
            "course": "python-internship",
            "application_type": "internship",
        },
    ).json()

    course_section = test_client.get(
        "/api/admin/admissions",
        headers=auth_headers,
        params={"application_group": "course"},
    )
    internship_section = test_client.get(
        "/api/admin/admissions",
        headers=auth_headers,
        params={"application_group": "internship"},
    )

    assert course_section.status_code == 200
    assert course_section.json()["total"] == 1
    assert course_section.json()["items"][0]["id"] == programme_application["id"]
    assert course_section.json()["items"][0]["application_type"] == "programme"
    assert internship_section.status_code == 200
    assert internship_section.json()["total"] == 1
    assert internship_section.json()["items"][0]["id"] == internship_application["id"]


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


def test_admission_legacy_integer_ids_are_not_supported(client, auth_headers):
    test_client, _ = client
    response = test_client.get(
        "/api/admin/admissions/1", headers=auth_headers
    )
    assert response.status_code == 404


def test_contact_legacy_integer_ids_are_not_supported(client, auth_headers):
    test_client, _ = client
    response = test_client.get("/api/admin/contacts/73", headers=auth_headers)
    assert response.status_code == 404


def test_contact_model_does_not_have_legacy_id():
    assert "legacy_id" not in Contact.__table__.c


def test_accepted_admissions_update_course_and_internship_card_counts(
    client, auth_headers, published_course
):
    test_client, testing_session = client
    with testing_session() as session:
        internship = Internship(
            title="Python Internship",
            slug="python-internship",
            short_description="Build practical Python skills.",
            full_description="A published Python internship.",
            duration_months=3,
            is_published=True,
        )
        session.add(internship)
        session.commit()

    programme_application = test_client.post("/api/admissions", json=ADMISSION).json()
    internship_application = test_client.post(
        "/api/admissions",
        json={
            **ADMISSION,
            "email": "intern@example.com",
            "course": "python-internship",
            "application_type": "internship",
        },
    ).json()

    assert test_client.get("/api/programmes").json()[0]["accepted_count"] == 0
    assert test_client.get("/api/internships").json()[0]["accepted_count"] == 0

    for application in (programme_application, internship_application):
        response = test_client.patch(
            f"/api/admin/admissions/{application['id']}",
            headers=auth_headers,
            json={"status": "accepted"},
        )
        assert response.status_code == 200

    assert test_client.get("/api/programmes").json()[0]["accepted_count"] == 1
    assert test_client.get("/api/internships").json()[0]["accepted_count"] == 1
    admin_internships = test_client.get(
        "/api/admin/internships", headers=auth_headers
    )
    assert admin_internships.json()["items"][0]["accepted_count"] == 1

    rejected = test_client.patch(
        f"/api/admin/admissions/{programme_application['id']}",
        headers=auth_headers,
        json={"status": "rejected"},
    )
    assert rejected.status_code == 200
    assert test_client.get("/api/programmes").json()[0]["accepted_count"] == 0


def test_admin_course_cards_include_accepted_admission_count(
    client, auth_headers, published_course
):
    test_client, _ = client
    application = test_client.post("/api/admissions", json=ADMISSION).json()

    before_acceptance = test_client.get(
        "/api/admin/courses",
        headers=auth_headers,
        params={"course_type": "programme"},
    )
    assert before_acceptance.status_code == 200
    assert before_acceptance.json()["items"][0]["accepted_count"] == 0

    accepted = test_client.patch(
        f"/api/admin/admissions/{application['id']}",
        headers=auth_headers,
        json={"status": "accepted"},
    )
    assert accepted.status_code == 200

    after_acceptance = test_client.get(
        "/api/admin/courses",
        headers=auth_headers,
        params={"course_type": "programme"},
    )
    assert after_acceptance.json()["items"][0]["accepted_count"] == 1


def test_all_models_do_not_have_legacy_id():
    for model in (Admin, Admission, Contact, Course, Feedback, Internship):
        assert "legacy_id" not in model.__table__.c
