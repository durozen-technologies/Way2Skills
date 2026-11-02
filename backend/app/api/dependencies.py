from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import decode_access_token
from app.db.session import get_session
from app.models.admin import Admin

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Admin:
    unauthorized = HTTPException(
        status_code=401,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        subject = decode_access_token(credentials.credentials, settings)
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Authentication is not configured"
        ) from None
    if subject is None:
        raise unauthorized
    try:
        admin_id = UUID(subject)
    except ValueError:
        if not subject.isdecimal() or int(subject) < 1:
            raise unauthorized
        admin = session.scalar(select(Admin).where(Admin.legacy_id == int(subject)))
    else:
        admin = session.get(Admin, admin_id)
    if admin is None or not admin.is_active:
        raise unauthorized
    return admin
