from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.api.identifiers import get_record_by_id
from app.db.session import get_session
from app.models.admission import Admission
from app.models.course import Course
from app.models.course_category import CourseCategory
from app.models.enums import CourseType
from app.schemas.admin import PageResponse
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])


def _course_by_id(session: Session, course_id: str) -> Course:
    course = get_record_by_id(session, Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _activate_category(session: Session, name: str) -> None:
    category = session.get(CourseCategory, name)
    if category is None:
        session.add(CourseCategory(name=name, is_active=True))
    elif not category.is_active:
        raise HTTPException(
            status_code=409,
            detail="This category is no longer available for new assignments",
        )


@router.get("", response_model=PageResponse)
def list_courses(
    session: Session = Depends(get_session),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    search: Annotated[str | None, Query(max_length=100)] = None,
    course_type: CourseType | None = None,
    category: Annotated[str | None, Query(max_length=80)] = None,
    is_published: bool | None = None,
) -> PageResponse:
    conditions = []
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Course.title.ilike(pattern),
                Course.slug.ilike(pattern),
                Course.short_description.ilike(pattern),
                Course.category.ilike(pattern),
            )
        )
    if course_type is not None:
        conditions.append(Course.course_type == course_type.value)
    if category and category.strip():
        conditions.append(Course.category == category.strip())
    if is_published is not None:
        conditions.append(Course.is_published.is_(is_published))
    total = session.scalar(select(func.count()).select_from(Course).where(*conditions)) or 0
    records = session.scalars(
        select(Course)
        .where(*conditions)
        .order_by(Course.display_order, Course.id)
        .offset(offset)
        .limit(limit)
    ).all()
    return PageResponse(
        items=[CourseRead.model_validate(item).model_dump(mode="json") for item in records],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate, session: Session = Depends(get_session)
) -> Course:
    course = Course(**payload.model_dump(mode="json"))
    session.add(course)
    _activate_category(session, course.category)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="A course with this slug already exists") from exc
    session.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseRead)
def get_course(
    course_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Course:
    return _course_by_id(session, course_id)


@router.patch("/{course_id}", response_model=CourseRead)
def update_course(
    payload: CourseUpdate,
    course_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> Course:
    course = _course_by_id(session, course_id)
    updates = payload.model_dump(exclude_unset=True, mode="json")
    if "category" in updates and updates["category"] != course.category:
        _activate_category(session, updates["category"])
    for field, value in updates.items():
        setattr(course, field, value)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="A course with this slug already exists") from exc
    session.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: Annotated[str, Path(min_length=1, max_length=36)],
    session: Session = Depends(get_session),
) -> None:
    course = _course_by_id(session, course_id)
    referenced = session.scalar(
        select(Admission.id).where(Admission.course == course.slug).limit(1)
    )
    if referenced is not None:
        raise HTTPException(
            status_code=409,
            detail="This course is referenced by admission records and cannot be deleted",
        )
    session.delete(course)
    session.commit()
