from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.admission import AdmissionCreate
from app.schemas.common import SubmissionReceipt
from app.services.admissions import create_admission

router = APIRouter()


@router.post("", response_model=SubmissionReceipt, status_code=status.HTTP_201_CREATED)
def submit_admission(
    payload: AdmissionCreate, session: Session = Depends(get_session)
) -> SubmissionReceipt:
    admission = create_admission(session, payload)
    return SubmissionReceipt(
        id=admission.id, status=admission.status, created_at=admission.created_at
    )
