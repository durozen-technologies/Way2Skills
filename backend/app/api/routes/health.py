from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import DatabaseConfigurationError, get_session

router = APIRouter()


@router.get("/health")
def health(response: Response, session: Session = Depends(get_session)) -> dict[str, str]:
    try:
        session.execute(text("SELECT 1"))
    except (SQLAlchemyError, DatabaseConfigurationError):
        response.status_code = 503
        return {"status": "degraded", "database": "disconnected"}
    return {"status": "ok", "database": "connected"}
