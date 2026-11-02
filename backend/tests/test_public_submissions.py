from uuid import UUID

from sqlalchemy import select

from app.models.admission import Admission
from app.models.contact import Contact

CONTACT = {
    "name": "Taylor Student",
    "email": "Taylor.Student@example.com",
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
    "message": "Please contact me about the course.",
}


def test_contact_submission_persists_and_normalizes(client):
    test_client, testing_session = client
    response = test_client.post(
        "/api/contact",
        json={**CONTACT, "phone": "+1 (234) 567-890", "topic": "  ", "email": CONTACT["email"]},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "new"
    assert str(UUID(body["id"])) == body["id"]
    assert not {"name", "email", "phone", "topic", "message"} & body.keys()
    with testing_session() as session:
        record = session.scalar(select(Contact).where(Contact.id == UUID(body["id"])))
        assert record is not None
        assert record.email == "taylor.student@example.com"
        assert record.phone == "1234567890"
        assert record.topic is None
        assert record.message == CONTACT["message"]


def test_contact_phone_and_email_validation_does_not_echo_input(client):
    test_client, _ = client
    response = test_client.post(
        "/api/contact",
        json={**CONTACT, "email": "private-invalid-value", "phone": "123"},
    )

    assert response.status_code == 422
    assert "private-invalid-value" not in response.text
    assert CONTACT["message"] not in response.text


def test_contact_missing_required_fields_is_rejected(client):
    test_client, _ = client
    response = test_client.post("/api/contact", json={"name": "A"})

    assert response.status_code == 422


def test_admission_submission_persists_with_pending_status(client, published_course):
    test_client, testing_session = client
    response = test_client.post("/api/admissions", json=ADMISSION)

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    with testing_session() as session:
        record = session.scalar(select(Admission).where(Admission.id == UUID(body["id"])))
        assert record is not None
        assert record.education == "undergraduate"
        assert record.course == "full-stack-development"


def test_admission_accepts_all_supported_education_values(client, published_course):
    test_client, _ = client
    for education in ("school", "diploma", "undergraduate", "graduate", "other"):
        response = test_client.post(
            "/api/admissions",
            json={**ADMISSION, "education": education, "message": ""},
        )
        assert response.status_code == 201
        assert "message" not in response.json()


def test_admission_rejects_invalid_education_course_and_phone(client):
    test_client, _ = client
    response = test_client.post(
        "/api/admissions",
        json={**ADMISSION, "education": "invalid", "course": "unknown", "phone": "123"},
    )

    assert response.status_code == 422
