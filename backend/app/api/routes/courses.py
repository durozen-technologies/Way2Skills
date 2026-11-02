from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models.course import Course
from app.models.enums import CourseType
from app.models.internship import Internship
from app.schemas.course import CourseRead
from app.schemas.internship import InternshipRead

router = APIRouter()
internships_router = APIRouter()
programmes_router = APIRouter()


def _published_courses(
    session: Session, course_type: CourseType | None = None
) -> list[Course]:
    statement = select(Course).where(Course.is_published.is_(True))
    if course_type is not None:
        statement = statement.where(Course.course_type == course_type.value)
    return list(
        session.scalars(statement.order_by(Course.display_order, Course.id)).all()
    )


@router.get("", response_model=list[CourseRead])
def list_courses(session: Session = Depends(get_session)) -> list[Course]:
    return _published_courses(session, CourseType.COURSE)


@router.get("/{slug}", response_model=CourseRead)
def get_course(
    slug: Annotated[str, Path(min_length=2, max_length=180)],
    session: Session = Depends(get_session),
) -> Course:
    course = session.scalar(
        select(Course).where(Course.slug == slug, Course.is_published.is_(True))
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@internships_router.get("", response_model=list[InternshipRead])
def list_internships(session: Session = Depends(get_session)) -> list[InternshipRead]:
    return list(
        session.scalars(
            select(Internship)
            .where(Internship.is_published.is_(True))
            .order_by(Internship.created_at.desc(), Internship.id)
        ).all()
    )


@internships_router.get("/{slug}", response_model=InternshipRead)
def get_internship(
    slug: Annotated[str, Path(min_length=2, max_length=180)],
    session: Session = Depends(get_session),
) -> Internship:
    internship = session.scalar(
        select(Internship).where(
            Internship.slug == slug, Internship.is_published.is_(True)
        )
    )
    if internship is None:
        raise HTTPException(status_code=404, detail="Internship not found")
    return internship


@programmes_router.get("", response_model=list[CourseRead])
def list_programmes(session: Session = Depends(get_session)) -> list[Course]:
    return _published_courses(session, CourseType.PROGRAMME)
