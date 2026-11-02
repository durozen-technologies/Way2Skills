from collections import defaultdict
from threading import Lock
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.core.config import Settings, get_settings
from app.db.session import get_session
from app.models.admin import Admin
from app.schemas.auth import AdminMe, LoginRequest, TokenResponse
from app.services.auth import authenticate_admin

router = APIRouter()
_failed_logins: dict[str, list[float]] = defaultdict(list)
_failed_logins_lock = Lock()
_LOGIN_WINDOW_SECONDS = 60
_LOGIN_FAILURE_LIMIT = 5


def _register_failed_login(client_ip: str) -> int:
    now = monotonic()
    with _failed_logins_lock:
        for address in list(_failed_logins):
            _failed_logins[address] = [
                attempt
                for attempt in _failed_logins[address]
                if now - attempt < _LOGIN_WINDOW_SECONDS
            ]
            if not _failed_logins[address]:
                del _failed_logins[address]
        attempts = _failed_logins[client_ip]
        attempts.append(now)
        return max(0, _LOGIN_FAILURE_LIMIT - len(attempts))


def _clear_failed_logins(client_ip: str) -> None:
    with _failed_logins_lock:
        _failed_logins.pop(client_ip, None)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    client_ip = request.client.host if request.client else "unknown"
    with _failed_logins_lock:
        now = monotonic()
        attempts = [
            attempt
            for attempt in _failed_logins.get(client_ip, [])
            if now - attempt < _LOGIN_WINDOW_SECONDS
        ]
        _failed_logins[client_ip] = attempts
        if len(attempts) >= _LOGIN_FAILURE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Try again later.",
                headers={"Retry-After": str(_LOGIN_WINDOW_SECONDS)},
            )
    try:
        token = authenticate_admin(session, payload, settings)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        ) from None
    if token is None:
        remaining = _register_failed_login(client_ip)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Try again later.",
                headers={"Retry-After": str(_LOGIN_WINDOW_SECONDS)},
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _clear_failed_logins(client_ip)
    access_token, expires_in = token
    return TokenResponse(access_token=access_token, expires_in=expires_in)


@router.get("/me", response_model=AdminMe)
def me(admin: Admin = Depends(get_current_admin)) -> AdminMe:
    return AdminMe(id=admin.id, email=admin.email, is_active=admin.is_active)
