from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.course import Course
from app.models.enums import CourseType
from app.schemas.admission import AdmissionCreate


def create_admission(session: Session, data: AdmissionCreate) -> Admission:
    course = session.scalar(
        select(Course).where(
            Course.slug == data.course,
            Course.is_published.is_(True),
            Course.course_type.in_([CourseType.COURSE.value, CourseType.PROGRAMME.value]),
        )
    )
    if course is None:
        raise HTTPException(status_code=422, detail="Select an available course or programme")
    admission = Admission(**data.model_dump())
    session.add(admission)
    session.commit()
    session.refresh(admission)
    return admission
