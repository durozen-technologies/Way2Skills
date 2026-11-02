from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.api.identifiers import get_record_by_id
from app.db.session import get_session
from app.models.feedback import Feedback
from app.schemas.admin import PageResponse
from app.schemas.feedback import FeedbackRead, FeedbackStatusUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("", response_model=PageResponse)
def list_feedback(
    session: Session = Depends(get_session),
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
) -> PageResponse:
    total = session.scalar(select(func.count()).select_from(Feedback)) or 0
    records = session.scalars(
        select(Feedback)
        .order_by(Feedback.created_at.desc(), Feedback.id)
        .offset(offset)
        .limit(limit)
    ).all()
    return PageResponse(
        items=[FeedbackRead.model_validate(item).model_dump(mode="json") for item in records],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch("/{feedback_id}", response_model=FeedbackRead)
def update_feedback_status(
    payload: FeedbackStatusUpdate,
    feedback_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Feedback:
    feedback = get_record_by_id(session, Feedback, feedback_id)
    if feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback.status = payload.status
    session.commit()
    session.refresh(feedback)
    return feedback


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Response:
    feedback = get_record_by_id(session, Feedback, feedback_id)
    if feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    session.delete(feedback)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
