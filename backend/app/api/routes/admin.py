from typing import Annotated, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.api.identifiers import get_record_by_id
from app.db.session import get_session
from app.models.admin import Admin
from app.models.admission import Admission
from app.models.contact import Contact
from app.models.enums import AdmissionStatus, ContactStatus
from app.schemas.admission import AdmissionRead, AdmissionStatusUpdate
from app.schemas.admin import DashboardResponse, PageResponse
from app.schemas.contact import ContactRead, ContactStatusUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])
ModelT = TypeVar("ModelT", Contact, Admission)


def _page_response(
    session: Session,
    model: type[ModelT],
    schema: type[ContactRead] | type[AdmissionRead],
    limit: int,
    offset: int,
    search: str | None,
    status_filter: str | None,
) -> PageResponse:
    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                model.name.ilike(pattern),
                model.email.ilike(pattern),
                model.phone.ilike(pattern),
            )
        )
    if status_filter:
        conditions.append(model.status == status_filter)
    total = session.scalar(select(func.count()).select_from(model).where(*conditions)) or 0
    records = session.scalars(
        select(model)
        .where(*conditions)
        .order_by(model.created_at.desc(), model.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return PageResponse(
        items=[schema.model_validate(record).model_dump(mode="json") for record in records],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(session: Session = Depends(get_session)) -> DashboardResponse:
    return DashboardResponse(
        contacts_total=session.scalar(select(func.count()).select_from(Contact)) or 0,
        contacts_new=session.scalar(
            select(func.count()).select_from(Contact).where(Contact.status == ContactStatus.NEW)
        )
        or 0,
        admissions_total=session.scalar(select(func.count()).select_from(Admission)) or 0,
        admissions_pending=session.scalar(
            select(func.count())
            .select_from(Admission)
            .where(Admission.status == AdmissionStatus.PENDING)
        )
        or 0,
    )


@router.get("/contacts", response_model=PageResponse)
def list_contacts(
    session: Session = Depends(get_session),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    search: Annotated[str | None, Query(max_length=100)] = None,
    status_filter: Annotated[ContactStatus | None, Query(alias="status")] = None,
) -> PageResponse:
    return _page_response(
        session, Contact, ContactRead, limit, offset, search, status_filter.value if status_filter else None
    )


@router.get("/admissions", response_model=PageResponse)
def list_admissions(
    session: Session = Depends(get_session),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    search: Annotated[str | None, Query(max_length=100)] = None,
    status_filter: Annotated[AdmissionStatus | None, Query(alias="status")] = None,
) -> PageResponse:
    return _page_response(
        session,
        Admission,
        AdmissionRead,
        limit,
        offset,
        search,
        status_filter.value if status_filter else None,
    )


@router.get("/contacts/{record_id}", response_model=ContactRead)
def get_contact(
    record_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Contact:
    record = get_record_by_id(session, Contact, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Contact enquiry not found")
    return record


@router.get("/admissions/{record_id}", response_model=AdmissionRead)
def get_admission(
    record_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Admission:
    record = get_record_by_id(session, Admission, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Admission application not found")
    return record


@router.patch("/contacts/{record_id}", response_model=ContactRead)
def update_contact(
    payload: ContactStatusUpdate,
    record_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Contact:
    record = get_record_by_id(session, Contact, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Contact enquiry not found")
    record.status = payload.status
    session.commit()
    session.refresh(record)
    return record


@router.patch("/admissions/{record_id}", response_model=AdmissionRead)
def update_admission(
    payload: AdmissionStatusUpdate,
    record_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Admission:
    record = get_record_by_id(session, Admission, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Admission application not found")
    record.status = payload.status
    session.commit()
    session.refresh(record)
    return record
