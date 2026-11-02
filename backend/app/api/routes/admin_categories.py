from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.db.session import get_session
from app.models.course import Course
from app.models.course_category import CourseCategory
from app.schemas.course_category import CourseCategoryRead

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[CourseCategoryRead])
def list_categories(session: Session = Depends(get_session)) -> list[dict[str, str | int]]:
    course_counts = dict(
        session.execute(
            select(Course.category, func.count(Course.id)).group_by(Course.category)
        ).all()
    )
    categories = session.scalars(
        select(CourseCategory)
        .where(CourseCategory.is_active.is_(True))
        .order_by(CourseCategory.name)
    ).all()
    return [
        {"name": category.name, "course_count": course_counts.get(category.name, 0)}
        for category in categories
    ]


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    name: Annotated[str, Query(min_length=1, max_length=80)],
    session: Session = Depends(get_session),
) -> Response:
    category = session.get(CourseCategory, name)
    if category is None or not category.is_active:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = False
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
