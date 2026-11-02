from uuid import UUID

import pytest
from sqlalchemy import select

from app.models.course import Course
from app.models.internship import Internship
from app.models.enums import CourseCertificate

INTERNSHIP = {
    "title": "Frontend Internship",
    "slug": "frontend-internship",
    "short_description": "Build user interfaces with a product team.",
    "full_description": "A practical frontend internship programme.",
    "duration_months": 3,
    "skills": ["React", "TypeScript"],
    "certificates": [CourseCertificate.INTERNSHIP_COMPLETION.value],
    "learning_outcomes": ["Build accessible interfaces", "Contribute to code reviews"],
    "internship_type": "hybrid",
    "cover_image_url": "https://images.example.org/frontend-internship.jpg",
    "is_published": False,
}


def test_admin_internship_routes_require_authentication(client):
    test_client, _ = client
    assert test_client.get("/api/admin/internships").status_code == 401
    assert test_client.post(
        "/api/admin/internships", json=INTERNSHIP
    ).status_code == 401


def test_admin_internship_create_update_publish_filter_and_delete(client, auth_headers):
    test_client, testing_session = client
    created = test_client.post(
        "/api/admin/internships", json=INTERNSHIP, headers=auth_headers
    )
    assert created.status_code == 201
    record = created.json()
    internship_id = record["id"]
    assert str(UUID(internship_id)) == internship_id
    assert record["duration_months"] == 3
    assert record["skills"] == ["React", "TypeScript"]
    assert record["certificates"] == [
        CourseCertificate.INTERNSHIP_COMPLETION.value
    ]
    assert record["learning_outcomes"] == [
        "Build accessible interfaces",
        "Contribute to code reviews",
    ]
    assert record["cover_image_url"] == INTERNSHIP["cover_image_url"]
    assert test_client.get("/api/internships").json() == []
    assert test_client.get(
        f"/api/internships/{record['slug']}"
    ).status_code == 404

    updated = test_client.patch(
        f"/api/admin/internships/{internship_id}",
        json={"duration_months": 6, "is_published": True},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["duration_months"] == 6
    assert len(test_client.get("/api/internships").json()) == 1
    assert test_client.get(
        f"/api/internships/{record['slug']}"
    ).json()["duration_months"] == 6

    draft_page = test_client.get(
        "/api/admin/internships?is_published=false", headers=auth_headers
    )
    assert draft_page.status_code == 200
    assert draft_page.json()["total"] == 0

    unpublished = test_client.patch(
        f"/api/admin/internships/{internship_id}",
        json={"is_published": False},
        headers=auth_headers,
    )
    assert unpublished.status_code == 200
    assert test_client.get("/api/internships").json() == []

    with testing_session() as session:
        stored = session.scalar(
            select(Internship).where(Internship.id == UUID(internship_id))
        )
        assert stored is not None
        assert stored.duration_months == 6

    deleted = test_client.delete(
        f"/api/admin/internships/{internship_id}", headers=auth_headers
    )
    assert deleted.status_code == 204
    assert test_client.get(
        f"/api/admin/internships/{internship_id}", headers=auth_headers
    ).status_code == 404


@pytest.mark.parametrize(
    "invalid_values",
    [
        {"duration_months": 0},
        {"duration_months": -1},
        {"duration_months": 1.5},
        {"duration_months": "not-a-number"},
        {"positions": 0},
        {"internship_type": "flexible"},
        {"application_url": "not-a-url"},
        {"cover_image_url": "not-a-url"},
        {
            "certificates": [
                CourseCertificate.INTERNSHIP_COMPLETION.value,
                CourseCertificate.INTERNSHIP_COMPLETION.value,
            ]
        },
        {"application_deadline": "2026-01-01", "start_date": "2026-02-01"},
    ],
)
def test_invalid_internship_values_are_rejected(client, auth_headers, invalid_values):
    test_client, _ = client
    response = test_client.post(
        "/api/admin/internships",
        json={**INTERNSHIP, **invalid_values},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_internship_duplicate_slug_returns_conflict(client, auth_headers):
    test_client, _ = client
    first = test_client.post(
        "/api/admin/internships", json=INTERNSHIP, headers=auth_headers
    )
    second = test_client.post(
        "/api/admin/internships",
        json={**INTERNSHIP, "title": "Another internship"},
        headers=auth_headers,
    )
    assert first.status_code == 201
    assert second.status_code == 409


def test_legacy_course_internship_is_not_returned_as_an_internship(client):
    test_client, testing_session = client
    with testing_session() as session:
        session.add(
            Course(
                title="Legacy course catalogue record",
                slug="legacy-course-catalogue-record",
                short_description="Old catalogue entry.",
                full_description="Old course-type internship record.",
                category="Development",
                course_type="internship",
                duration="3 months",
                level="Beginner",
                delivery_mode="Online",
                is_published=True,
                display_order=0,
            )
        )
        session.commit()
    assert test_client.get("/api/internships").json() == []
