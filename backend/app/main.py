import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import DatabaseConfigurationError

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    is_production = settings.environment.strip().lower() == "production"
    application = FastAPI(
        title="Way2Skills API",
        description="Contact enquiries, admission applications, and admin APIs.",
        version="0.1.0",
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Request validation failed",
                "errors": [
                    {
                        "loc": list(error["loc"]),
                        "msg": error["msg"],
                        "type": error["type"],
                    }
                    for error in exc.errors()
                ],
            },
        )

    @application.exception_handler(SQLAlchemyError)
    async def database_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        original = getattr(exc, "orig", None)
        sqlstate = getattr(original, "sqlstate", None)
        frames = "".join(traceback.format_tb(exc.__traceback__))
        logger.error(
            "Database operation failed: method=%s path=%s exception_type=%s sqlstate=%s\n"
            "Traceback frames (SQL and parameters omitted):\n%s",
            request.method,
            request.url.path,
            type(exc).__name__,
            sqlstate or "unavailable",
            frames,
        )
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Database operation unavailable. Please try again later."
            },
        )

    @application.exception_handler(DatabaseConfigurationError)
    async def database_configuration_error_handler(
        request: Request, exc: DatabaseConfigurationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "disconnected"},
        )

    application.include_router(api_router)
    return application


app = create_app()
