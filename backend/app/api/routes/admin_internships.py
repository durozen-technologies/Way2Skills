from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.api.identifiers import get_record_by_id
from app.db.session import get_session
from app.models.internship import Internship
from app.schemas.admin import PageResponse
from app.schemas.internship import InternshipCreate, InternshipRead, InternshipUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])


def _internship_by_id(session: Session, internship_id: str) -> Internship:
    internship = get_record_by_id(session, Internship, internship_id)
    if internship is None:
        raise HTTPException(status_code=404, detail="Internship not found")
    return internship


@router.get("", response_model=PageResponse)
def list_internships(
    session: Session = Depends(get_session),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    search: Annotated[str | None, Query(max_length=100)] = None,
    is_published: bool | None = None,
) -> PageResponse:
    conditions = []
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Internship.title.ilike(pattern),
                Internship.slug.ilike(pattern),
                Internship.short_description.ilike(pattern),
                Internship.full_description.ilike(pattern),
            )
        )
    if is_published is not None:
        conditions.append(Internship.is_published.is_(is_published))
    total = session.scalar(
        select(func.count()).select_from(Internship).where(*conditions)
    ) or 0
    records = session.scalars(
        select(Internship)
        .where(*conditions)
        .order_by(Internship.created_at.desc(), Internship.id)
        .offset(offset)
        .limit(limit)
    ).all()
    return PageResponse(
        items=[
            InternshipRead.model_validate(item).model_dump(mode="json")
            for item in records
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=InternshipRead, status_code=status.HTTP_201_CREATED)
def create_internship(
    payload: InternshipCreate, session: Session = Depends(get_session)
) -> Internship:
    internship = Internship(**payload.model_dump(mode="json"))
    session.add(internship)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="An internship with this slug already exists"
        ) from exc
    session.refresh(internship)
    return internship


@router.get("/{internship_id}", response_model=InternshipRead)
def get_internship(
    internship_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Internship:
    return _internship_by_id(session, internship_id)


@router.patch("/{internship_id}", response_model=InternshipRead)
def update_internship(
    payload: InternshipUpdate,
    internship_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Internship:
    internship = _internship_by_id(session, internship_id)
    updates = payload.model_dump(exclude_unset=True, mode="json")
    for field, value in updates.items():
        setattr(internship, field, value)
    if (
        internship.start_date
        and internship.application_deadline
        and internship.application_deadline < internship.start_date
    ):
        raise HTTPException(
            status_code=422,
            detail="Application deadline cannot be before the start date",
        )
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=409, detail="An internship with this slug already exists"
        ) from exc
    session.refresh(internship)
    return internship


@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_internship(
    internship_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> None:
    internship = _internship_by_id(session, internship_id)
    session.delete(internship)
    session.commit()
