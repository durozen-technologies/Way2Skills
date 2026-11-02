from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.common import SubmissionReceipt
from app.schemas.contact import ContactCreate
from app.services.contact import create_contact

router = APIRouter()


@router.post("", response_model=SubmissionReceipt, status_code=status.HTTP_201_CREATED)
def submit_contact(
    payload: ContactCreate, session: Session = Depends(get_session)
) -> SubmissionReceipt:
    contact = create_contact(session, payload)
    return SubmissionReceipt(
        id=contact.id, status=contact.status, created_at=contact.created_at
    )
