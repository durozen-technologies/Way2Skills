from app.schemas.common import APIModel


class CourseCategoryRead(APIModel):
    name: str
    course_count: int
