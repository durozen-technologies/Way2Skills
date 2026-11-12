from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models.admission import Admission
from app.models.course import Course
from app.models.enums import AdmissionStatus, CourseType
from app.models.internship import Internship
from app.schemas.course import CourseCardRead, CourseRead
from app.schemas.internship import InternshipCardRead, InternshipRead

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


def _accepted_admission_counts(
    session: Session, application_type: CourseType, slugs: list[str]
) -> dict[str, int]:
    if not slugs:
        return {}
    rows = session.execute(
        select(Admission.course, func.count(Admission.id))
        .where(
            Admission.application_type == application_type.value,
            Admission.status == AdmissionStatus.ACCEPTED,
            Admission.course.in_(slugs),
        )
        .group_by(Admission.course)
    )
    return dict(rows.all())


def _course_read(
    course: Course, accepted_count: int
) -> CourseCardRead:
    data = CourseRead.model_validate(course).model_dump(mode="json")
    data["accepted_count"] = accepted_count
    return CourseCardRead.model_validate(data)


@router.get("", response_model=list[CourseCardRead])
def list_courses(session: Session = Depends(get_session)) -> list[CourseCardRead]:
    courses = _published_courses(session, CourseType.COURSE)
    counts = _accepted_admission_counts(
        session, CourseType.COURSE, [course.slug for course in courses]
    )
    return [_course_read(course, counts.get(course.slug, 0)) for course in courses]


@router.get("/{slug}", response_model=CourseCardRead)
def get_course(
    slug: Annotated[str, Path(min_length=2, max_length=180)],
    session: Session = Depends(get_session),
) -> CourseCardRead:
    course = session.scalar(
        select(Course).where(Course.slug == slug, Course.is_published.is_(True))
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return _course_read(
        course,
        _accepted_admission_counts(session, CourseType(course.course_type), [course.slug]).get(
            course.slug, 0
        ),
    )


@internships_router.get("", response_model=list[InternshipCardRead])
def list_internships(
    session: Session = Depends(get_session),
) -> list[InternshipCardRead]:
    internships = list(
        session.scalars(
            select(Internship)
            .where(Internship.is_published.is_(True))
            .order_by(Internship.created_at.desc(), Internship.id)
        ).all()
    )
    counts = _accepted_admission_counts(
        session, CourseType.INTERNSHIP, [internship.slug for internship in internships]
    )
    return [
        InternshipCardRead.model_validate(
            {
                **InternshipRead.model_validate(internship).model_dump(mode="json"),
                "accepted_count": counts.get(internship.slug, 0),
            }
        )
        for internship in internships
    ]


@internships_router.get("/{slug}", response_model=InternshipCardRead)
def get_internship(
    slug: Annotated[str, Path(min_length=2, max_length=180)],
    session: Session = Depends(get_session),
) -> InternshipCardRead:
    internship = session.scalar(
        select(Internship).where(
            Internship.slug == slug, Internship.is_published.is_(True)
        )
    )
    if internship is None:
        raise HTTPException(status_code=404, detail="Internship not found")
    return InternshipCardRead.model_validate(
        {
            **InternshipRead.model_validate(internship).model_dump(mode="json"),
            "accepted_count": _accepted_admission_counts(
                session, CourseType.INTERNSHIP, [internship.slug]
            ).get(internship.slug, 0),
        }
    )


@programmes_router.get("", response_model=list[CourseCardRead])
def list_programmes(
    session: Session = Depends(get_session),
) -> list[CourseCardRead]:
    programmes = _published_courses(session, CourseType.PROGRAMME)
    counts = _accepted_admission_counts(
        session, CourseType.PROGRAMME, [programme.slug for programme in programmes]
    )
    return [
        _course_read(programme, counts.get(programme.slug, 0))
        for programme in programmes
    ]
