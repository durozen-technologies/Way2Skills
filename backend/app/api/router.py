from fastapi import APIRouter

from app.api.routes import (
    admin,
    admin_categories,
    admin_courses,
    admin_feedback,
    admin_internships,
    admissions,
    auth,
    contact,
    courses,
    feedback,
    health,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(admissions.router, prefix="/admissions", tags=["admissions"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_courses.router, prefix="/admin/courses", tags=["admin courses"])
api_router.include_router(
    admin_categories.router, prefix="/admin/categories", tags=["admin categories"]
)
api_router.include_router(
    admin_feedback.router, prefix="/admin/feedback", tags=["admin feedback"]
)
api_router.include_router(
    admin_internships.router,
    prefix="/admin/internships",
    tags=["admin internships"],
)
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(courses.internships_router, prefix="/internships", tags=["internships"])
api_router.include_router(courses.programmes_router, prefix="/programmes", tags=["programmes"])
