from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import create_access_token, verify_password, verify_unknown_admin_password
from app.models.admin import Admin
from app.schemas.auth import LoginRequest


def authenticate_admin(
    session: Session, credentials: LoginRequest, settings: Settings
) -> tuple[str, int] | None:
    admin = session.scalar(select(Admin).where(Admin.email == credentials.email))
    if admin is None:
        verify_unknown_admin_password(credentials.password)
        return None
    if not verify_password(credentials.password, admin.password_hash) or not admin.is_active:
        return None
    return create_access_token(str(admin.id), settings)
