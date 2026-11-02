from uuid import UUID

import pytest
from sqlalchemy import select

from app.models.admission import Admission
from app.models.course import Course
from app.models.course_category import CourseCategory
from app.models.enums import CourseCertificate

COURSE = {
    "title": "Web Foundations",
    "slug": "web-foundations",
    "short_description": "Learn the foundations of web development.",
    "full_description": "A practical introduction to building for the web.",
    "category": "Development",
    "course_type": "course",
    "duration": "8 weeks",
    "level": "Beginner",
    "delivery_mode": "Online",
    "syllabus": ["HTML", "CSS", "JavaScript"],
    "card_theme": "sky",
    "is_published": False,
    "is_featured": False,
    "display_order": 0,
}


def test_admin_course_routes_require_authentication(client):
    test_client, _ = client
    assert test_client.get("/api/admin/courses").status_code == 401
    assert test_client.post("/api/admin/courses", json=COURSE).status_code == 401
    assert test_client.get("/api/admin/categories").status_code == 401
    assert test_client.delete(
        "/api/admin/categories", params={"name": "Development"}
    ).status_code == 401


def test_deleting_category_keeps_courses_and_all_course_data(client, auth_headers):
    test_client, testing_session = client
    payloads = [
        {
            **COURSE,
            "title": f"Category course {index}",
            "slug": f"category-course-{index}",
            "category": "Frontend",
            "image_url": f"https://images.example.org/course-{index}.jpg",
            "price": "1299.50",
            "curriculum": "Module 1\nModule 2",
            "benefits": "Benefit one\nBenefit two",
            "certificates": [CourseCertificate.COURSE_COMPLETION.value],
        }
        for index in range(3)
    ]
    created_courses = [
        test_client.post(
            "/api/admin/courses", json=payload, headers=auth_headers
        ).json()
        for payload in payloads
    ]
    unrelated = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "title": "Backend course", "slug": "backend-course", "category": "Backend"},
        headers=auth_headers,
    )
    assert unrelated.status_code == 201

    before = test_client.get(
        "/api/admin/categories", headers=auth_headers
    ).json()
    assert {item["name"]: item["course_count"] for item in before} == {
        "Backend": 1,
        "Frontend": 3,
    }

    deleted = test_client.delete(
        "/api/admin/categories",
        params={"name": "Frontend"},
        headers=auth_headers,
    )
    assert deleted.status_code == 204
    assert [item["name"] for item in test_client.get(
        "/api/admin/categories", headers=auth_headers
    ).json()] == ["Backend"]
    unavailable_assignment = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "title": "New frontend course", "slug": "new-frontend-course", "category": "Frontend"},
        headers=auth_headers,
    )
    assert unavailable_assignment.status_code == 409
    reassignment_to_deleted = test_client.patch(
        f"/api/admin/courses/{unrelated.json()['id']}",
        json={"category": "Frontend"},
        headers=auth_headers,
    )
    assert reassignment_to_deleted.status_code == 409

    for created in created_courses:
        retained = test_client.get(
            f"/api/admin/courses/{created['id']}", headers=auth_headers
        )
        assert retained.status_code == 200
        course = retained.json()
        assert course["category"] == "Frontend"
        assert course["image_url"] == created["image_url"]
        assert course["price"] == created["price"]
        assert course["curriculum"] == created["curriculum"]
        assert course["benefits"] == created["benefits"]
        assert course["certificates"] == created["certificates"]

    edited = test_client.patch(
        f"/api/admin/courses/{created_courses[0]['id']}",
        json={"short_description": "Updated without changing legacy category."},
        headers=auth_headers,
    )
    assert edited.status_code == 200
    assert edited.json()["category"] == "Frontend"
    assert test_client.get(
        "/api/admin/categories", headers=auth_headers
    ).json() == [{"name": "Backend", "course_count": 1}]

    with testing_session() as session:
        assert session.scalar(
            select(CourseCategory).where(CourseCategory.name == "Frontend")
        ).is_active is False
        assert session.scalar(
            select(Course).where(Course.category == "Frontend")
        ) is not None


def test_course_create_update_publish_and_public_listing(client, auth_headers):
    test_client, testing_session = client
    response = test_client.post("/api/admin/courses", json=COURSE, headers=auth_headers)
    assert response.status_code == 201
    course_id = response.json()["id"]
    assert str(UUID(course_id)) == course_id
    assert test_client.get("/api/courses").json() == []
    assert test_client.get("/api/courses/web-foundations").status_code == 404

    updated = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"is_published": True, "card_theme": "mint"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["card_theme"] == "mint"
    assert test_client.get("/api/courses").json()[0]["slug"] == "web-foundations"
    assert test_client.get("/api/courses/web-foundations").json()["is_published"] is True

    unpublished = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"is_published": False},
        headers=auth_headers,
    )
    assert unpublished.status_code == 200
    assert test_client.get("/api/courses").json() == []
    with testing_session() as session:
        assert session.scalar(select(Course).where(Course.slug == "web-foundations"))


def test_optional_internship_period_persists_updates_and_is_public(client, auth_headers):
    test_client, testing_session = client
    created = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "internship-period", "internship_period": 3},
        headers=auth_headers,
    )
    assert created.status_code == 201
    course_id = created.json()["id"]
    assert created.json()["internship_period"] == 3

    published = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"is_published": True},
        headers=auth_headers,
    )
    assert published.status_code == 200
    assert test_client.get("/api/courses").json()[0]["internship_period"] == 3
    assert test_client.get("/api/courses/internship-period").json()[
        "internship_period"
    ] == 3

    updated = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"internship_period": 6},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["internship_period"] == 6
    assert test_client.get("/api/courses/internship-period").json()[
        "internship_period"
    ] == 6

    cleared = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"internship_period": None},
        headers=auth_headers,
    )
    assert cleared.status_code == 200
    assert cleared.json()["internship_period"] is None
    assert test_client.get("/api/courses/internship-period").json()[
        "internship_period"
    ] is None

    without_period = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "no-internship-period"},
        headers=auth_headers,
    )
    assert without_period.status_code == 201
    assert without_period.json()["internship_period"] is None
    with testing_session() as session:
        stored = session.scalar(
            select(Course).where(Course.id == UUID(course_id))
        )
        assert stored is not None
        assert stored.internship_period is None


@pytest.mark.parametrize("value", [0, -1, 1.5, "invalid"])
def test_internship_period_must_be_a_positive_whole_number(
    client, auth_headers, value
):
    test_client, _ = client
    valid_course = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "internship-period-validation"},
        headers=auth_headers,
    )
    assert valid_course.status_code == 201

    response = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "invalid-internship-period", "internship_period": value},
        headers=auth_headers,
    )
    assert response.status_code == 422
    update_response = test_client.patch(
        f"/api/admin/courses/{valid_course.json()['id']}",
        json={"internship_period": value},
        headers=auth_headers,
    )
    assert update_response.status_code == 422


def test_internship_duration_months_flows_correctly(client, auth_headers):
    test_client, testing_session = client
    # 1. Create with internship_duration_months
    created = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "full-stack-web-internship", "duration": "4 Months", "internship_duration_months": 2},
        headers=auth_headers,
    )
    assert created.status_code == 201
    course_id = created.json()["id"]
    assert created.json()["internship_duration_months"] == 2
    assert created.json()["internship_period"] == 2

    # Publish
    test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"is_published": True},
        headers=auth_headers,
    )
    # Check public courses endpoint
    pub_course = test_client.get("/api/courses/full-stack-web-internship").json()
    assert pub_course["duration"] == "4 Months"
    assert pub_course["internship_duration_months"] == 2

    # 2. Update internship_duration_months
    updated = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"internship_duration_months": 3},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["internship_duration_months"] == 3
    assert test_client.get("/api/courses/full-stack-web-internship").json()["internship_duration_months"] == 3

    # 3. Create course without internship
    without = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "ui-ux-design", "duration": "3 Months"},
        headers=auth_headers,
    )
    assert without.status_code == 201
    assert without.json()["internship_duration_months"] is None


def test_course_details_optional_price_image_and_certificates_persist(
    client, auth_headers
):
    test_client, testing_session = client
    certificates = [
        CourseCertificate.COURSE_COMPLETION.value,
        CourseCertificate.PROJECT_COMPLETION.value,
    ]
    payload = {
        **COURSE,
        "slug": "course-details",
        "is_published": True,
        "image_url": "https://images.example.org/course.jpg",
        "curriculum": "Module 1\nModule 2\n  Topic 2.1",
        "benefits": "Build practical skills\nGet mentor feedback",
        "certificates": certificates,
    }

    created = test_client.post(
        "/api/admin/courses", json=payload, headers=auth_headers
    )
    assert created.status_code == 201
    course_id = created.json()["id"]
    assert created.json()["price"] is None
    assert created.json()["image_url"] == payload["image_url"]
    assert created.json()["curriculum"] == payload["curriculum"]
    assert created.json()["benefits"] == payload["benefits"]
    assert created.json()["certificates"] == certificates
    assert test_client.get("/api/courses/course-details").json()["curriculum"] == payload[
        "curriculum"
    ]

    updated = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={
            "price": "1299.50",
            "curriculum": "Updated curriculum\nWith line breaks",
            "benefits": "First benefit\nSecond benefit",
            "certificates": [CourseCertificate.INTERNSHIP_COMPLETION.value],
        },
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["price"] == "1299.50"
    assert updated.json()["curriculum"] == "Updated curriculum\nWith line breaks"
    assert updated.json()["benefits"] == "First benefit\nSecond benefit"
    assert updated.json()["certificates"] == [
        CourseCertificate.INTERNSHIP_COMPLETION.value
    ]

    with testing_session() as session:
        stored = session.scalar(select(Course).where(Course.id == UUID(course_id)))
        assert stored is not None
        assert stored.image_url == payload["image_url"]
        assert stored.curriculum == "Updated curriculum\nWith line breaks"
        assert stored.benefits == "First benefit\nSecond benefit"
        assert stored.certificates == [
            CourseCertificate.INTERNSHIP_COMPLETION.value
        ]


def test_course_content_limits_accept_maximum_and_reject_excess(client, auth_headers):
    test_client, testing_session = client
    valid_payload = {
        **COURSE,
        "slug": "content-limits",
        "short_description": "x" * 100,
        "full_description": " ".join(
            ["full description remains independent."] * 20
        ),
        "curriculum": "Line one\n\nLine two\nLine three\n\nLine four",
        "benefits": "Benefit one\n\nBenefit two\nBenefit three\n\nBenefit four\nBenefit five",
    }

    created = test_client.post(
        "/api/admin/courses", json=valid_payload, headers=auth_headers
    )
    assert created.status_code == 201
    assert created.json()["short_description"] == valid_payload["short_description"]
    assert created.json()["full_description"] == valid_payload["full_description"]
    assert created.json()["curriculum"] == valid_payload["curriculum"]
    assert created.json()["benefits"] == valid_payload["benefits"]

    course_id = created.json()["id"]
    valid_update = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={
            "short_description": "y" * 100,
            "curriculum": "One\n\nTwo\n\nThree\n\nFour",
            "benefits": "One\n\nTwo\n\nThree\n\nFour\n\nFive",
        },
        headers=auth_headers,
    )
    assert valid_update.status_code == 200
    assert len(valid_update.json()["short_description"]) == 100

    too_many_characters = test_client.post(
        "/api/admin/courses",
        json={
            **valid_payload,
            "slug": "too-many-characters",
            "short_description": "x" * 101,
        },
        headers=auth_headers,
    )
    too_many_curriculum_lines = test_client.post(
        "/api/admin/courses",
        json={
            **valid_payload,
            "slug": "too-many-curriculum-lines",
            "curriculum": "One\n\nTwo\n\nThree\n\nFour\n\nFive",
        },
        headers=auth_headers,
    )
    too_many_benefit_lines = test_client.post(
        "/api/admin/courses",
        json={
            **valid_payload,
            "slug": "too-many-benefit-lines",
            "benefits": "One\n\nTwo\n\nThree\n\nFour\n\nFive\n\nSix",
        },
        headers=auth_headers,
    )
    assert too_many_characters.status_code == 422
    assert too_many_curriculum_lines.status_code == 422
    assert too_many_benefit_lines.status_code == 422
    assert any(
        error["msg"] == "Value error, Short description must contain no more than 100 characters"
        for error in too_many_characters.json()["errors"]
    )
    assert any(
        error["msg"] == "Value error, Curriculum Overview must contain no more than 4 non-empty lines"
        for error in too_many_curriculum_lines.json()["errors"]
    )
    assert any(
        error["msg"] == "Value error, Benefits must contain no more than 5 non-empty lines"
        for error in too_many_benefit_lines.json()["errors"]
    )

    invalid_updates = (
        {"short_description": "x" * 101},
        {"curriculum": "One\n\nTwo\n\nThree\n\nFour\n\nFive"},
        {"benefits": "One\n\nTwo\n\nThree\n\nFour\n\nFive\n\nSix"},
    )
    for update in invalid_updates:
        response = test_client.patch(
            f"/api/admin/courses/{course_id}",
            json=update,
            headers=auth_headers,
        )
        assert response.status_code == 422

    with testing_session() as session:
        stored = session.scalar(select(Course).where(Course.id == UUID(course_id)))
        assert stored is not None
        stored.short_description = "l" * 121
        stored.curriculum = "One\nTwo\nThree\nFour\nFive"
        stored.benefits = "One\nTwo\nThree\nFour\nFive\nSix"
        session.commit()

    unrelated_update = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"title": "Edited without changing legacy content"},
        headers=auth_headers,
    )
    assert unrelated_update.status_code == 200
    assert unrelated_update.json()["short_description"] == "l" * 121
    assert unrelated_update.json()["curriculum"] == "One\nTwo\nThree\nFour\nFive"
    assert unrelated_update.json()["benefits"] == "One\nTwo\nThree\nFour\nFive\nSix"


def test_course_price_can_be_cleared_and_level_and_certificates_are_validated(
    client, auth_headers
):
    test_client, _ = client
    created = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "optional-price", "price": "50.25"},
        headers=auth_headers,
    )
    assert created.status_code == 201
    course_id = created.json()["id"]

    cleared = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"price": None, "level": "Advanced"},
        headers=auth_headers,
    )
    assert cleared.status_code == 200
    assert cleared.json()["price"] is None
    assert cleared.json()["level"] == "Advanced"

    invalid_level = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"level": "Expert"},
        headers=auth_headers,
    )
    invalid_certificates = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"certificates": ["Unrecognized certificate"]},
        headers=auth_headers,
    )
    duplicate_certificates = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={
            "certificates": [
                CourseCertificate.COURSE_COMPLETION.value,
                CourseCertificate.COURSE_COMPLETION.value,
            ]
        },
        headers=auth_headers,
    )
    invalid_price = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"price": -1},
        headers=auth_headers,
    )
    assert invalid_level.status_code == 422
    assert invalid_certificates.status_code == 422
    assert duplicate_certificates.status_code == 422
    assert invalid_price.status_code == 422


def test_updating_other_fields_preserves_legacy_level(client, auth_headers):
    test_client, testing_session = client
    created = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "legacy-level"},
        headers=auth_headers,
    )
    course_id = created.json()["id"]
    with testing_session() as session:
        course = session.scalar(select(Course).where(Course.id == UUID(course_id)))
        assert course is not None
        course.level = "Expert Beginner"
        session.commit()

    updated = test_client.patch(
        f"/api/admin/courses/{course_id}",
        json={"short_description": "Updated without changing the level."},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["level"] == "Expert Beginner"


def test_public_internships_and_programmes_are_filtered_by_type(client, auth_headers):
    test_client, _ = client
    for title, slug, course_type in (
        ("Internship term", "internship-term", "internship"),
        ("Study programme", "study-programme", "programme"),
    ):
        payload = {
            **COURSE,
            "title": title,
            "slug": slug,
            "course_type": course_type,
            "is_published": True,
        }
        assert test_client.post(
            "/api/admin/courses", json=payload, headers=auth_headers
        ).status_code == 201
    assert test_client.get("/api/internships").json() == []
    assert [item["slug"] for item in test_client.get("/api/programmes").json()] == [
        "study-programme"
    ]
    assert test_client.get("/api/courses").json() == []


def test_admin_course_search_filter_pagination_and_duplicate_slug(client, auth_headers):
    test_client, _ = client
    for position, slug in enumerate(
        ("development-foundations", "design-foundations", "backend-foundations")
    ):
        payload = {
            **COURSE,
            "slug": slug,
            "category": "Design" if position == 1 else "Development",
            "display_order": position,
        }
        assert test_client.post(
            "/api/admin/courses", json=payload, headers=auth_headers
        ).status_code == 201

    page = test_client.get(
        "/api/admin/courses?course_type=course&category=Development&limit=1",
        headers=auth_headers,
    )
    assert page.status_code == 200
    assert page.json()["total"] == 2
    assert len(page.json()["items"]) == 1

    search = test_client.get(
        "/api/admin/courses?search=design", headers=auth_headers
    )
    assert search.json()["total"] == 1
    duplicate = test_client.post(
        "/api/admin/courses",
        json=COURSE | {"slug": "development-foundations"},
        headers=auth_headers,
    )
    assert duplicate.status_code == 409


def test_course_delete_and_admission_reference_safeguard(client, auth_headers):
    test_client, testing_session = client
    payload = {**COURSE, "is_published": True}
    created = test_client.post(
        "/api/admin/courses", json=payload, headers=auth_headers
    )
    course_id = created.json()["id"]
    assert test_client.delete(
        f"/api/admin/courses/{course_id}", headers=auth_headers
    ).status_code == 204

    referenced = test_client.post(
        "/api/admin/courses",
        json={**payload, "slug": "referenced-course"},
        headers=auth_headers,
    )
    referenced_id = referenced.json()["id"]
    with testing_session() as session:
        session.add(
            Admission(
                name="Applicant",
                email="applicant@example.com",
                phone="1234567890",
                education="undergraduate",
                course="referenced-course",
            )
        )
        session.commit()
    response = test_client.delete(
        f"/api/admin/courses/{referenced_id}", headers=auth_headers
    )
    assert response.status_code == 409


def test_invalid_course_fields_and_unpublished_admission_course_are_rejected(
    client, auth_headers
):
    test_client, _ = client
    invalid = test_client.post(
        "/api/admin/courses",
        json={**COURSE, "slug": "Bad Slug", "price": -1},
        headers=auth_headers,
    )
    assert invalid.status_code == 422

    response = test_client.post(
        "/api/admissions",
        json={
            "name": "Applicant",
            "email": "applicant@example.com",
            "phone": "1234567890",
            "education": "undergraduate",
            "course": "unpublished-programme",
        },
    )
    assert response.status_code == 422
