from uuid import UUID

from app.models.feedback import Feedback


FEEDBACK = {
    "student_name": "Taylor Student",
    "course": "Full Stack Development",
    "rating": 5,
    "message": "The lessons helped me build practical projects.",
}


def test_feedback_submission_stays_pending_and_is_not_public(client):
    test_client, testing_session = client
    response = test_client.post("/api/feedback", json=FEEDBACK)

    assert response.status_code == 201
    body = response.json()
    assert str(UUID(body["id"])) == body["id"]
    assert body["status"] == "pending"
    assert test_client.get("/api/feedback").json() == []
    with testing_session() as session:
        assert session.get(Feedback, UUID(body["id"])).status == "pending"


def test_only_approved_feedback_is_public(client, auth_headers):
    test_client, testing_session = client
    pending = test_client.post("/api/feedback", json=FEEDBACK).json()
    approved = test_client.post(
        "/api/feedback",
        json={**FEEDBACK, "student_name": "Approved Student"},
    ).json()
    with testing_session() as session:
        record = session.get(Feedback, UUID(approved["id"]))
        assert record is not None
        record.status = "approved"
        session.commit()

    response = test_client.get("/api/feedback")
    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [approved["id"]]
    assert pending["id"] not in {item["id"] for item in response.json()}


def test_feedback_validation(client):
    test_client, _ = client
    for invalid in (
        {**FEEDBACK, "rating": 0},
        {**FEEDBACK, "rating": 6},
        {**FEEDBACK, "student_name": " "},
        {**FEEDBACK, "message": " "},
    ):
        assert test_client.post("/api/feedback", json=invalid).status_code == 422


def test_admin_feedback_routes_are_protected(client):
    test_client, _ = client
    assert test_client.get("/api/admin/feedback").status_code == 401
    assert test_client.patch(
        "/api/admin/feedback/00000000-0000-0000-0000-000000000000",
        json={"status": "approved"},
    ).status_code == 401
    assert test_client.delete(
        "/api/admin/feedback/00000000-0000-0000-0000-000000000000"
    ).status_code == 401


def test_admin_can_list_approve_reject_and_delete_feedback(client, auth_headers):
    test_client, _ = client
    submitted = test_client.post("/api/feedback", json=FEEDBACK)
    feedback_id = submitted.json()["id"]

    listing = test_client.get("/api/admin/feedback", headers=auth_headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["status"] == "pending"

    approved = test_client.patch(
        f"/api/admin/feedback/{feedback_id}",
        headers=auth_headers,
        json={"status": "approved"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    assert len(test_client.get("/api/feedback").json()) == 1

    rejected = test_client.patch(
        f"/api/admin/feedback/{feedback_id}",
        headers=auth_headers,
        json={"status": "rejected"},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert test_client.get("/api/feedback").json() == []

    deleted = test_client.delete(
        f"/api/admin/feedback/{feedback_id}", headers=auth_headers
    )
    assert deleted.status_code == 204
    assert test_client.get(
        "/api/admin/feedback", headers=auth_headers
    ).json()["total"] == 0
