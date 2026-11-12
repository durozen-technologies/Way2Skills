from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.course import Course
from app.models.enums import CourseType
from app.models.internship import Internship
from app.schemas.admission import AdmissionCreate


def create_admission(session: Session, data: AdmissionCreate) -> Admission:
    if data.application_type == CourseType.INTERNSHIP:
        offering = session.scalar(
            select(Internship).where(
                Internship.slug == data.course,
                Internship.is_published.is_(True),
            )
        )
        application_type = CourseType.INTERNSHIP
    else:
        course_types = (
            [data.application_type.value]
            if data.application_type is not None
            else [CourseType.COURSE.value, CourseType.PROGRAMME.value]
        )
        offering = session.scalar(
            select(Course).where(
                Course.slug == data.course,
                Course.is_published.is_(True),
                Course.course_type.in_(course_types),
            )
        )
        application_type = (
            CourseType(offering.course_type)
            if offering is not None
            else data.application_type
        )

    if offering is None or application_type is None:
        raise HTTPException(status_code=422, detail="Select an available offering")

    admission = Admission(
        **data.model_dump(exclude={"application_type"}),
        application_type=application_type,
    )
    session.add(admission)
    session.commit()
    session.refresh(admission)
    return admission
