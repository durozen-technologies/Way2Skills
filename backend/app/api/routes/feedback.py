from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter()


@router.get("", response_model=list[FeedbackRead])
def list_approved_feedback(session: Session = Depends(get_session)) -> list[Feedback]:
    return session.scalars(
        select(Feedback)
        .where(Feedback.status == "approved")
        .order_by(Feedback.created_at.desc(), Feedback.id)
        .limit(100)
    ).all()


@router.post("", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate, session: Session = Depends(get_session)
) -> Feedback:
    feedback = Feedback(**payload.model_dump())
    session.add(feedback)
    session.commit()
    session.refresh(feedback)
    return feedback
