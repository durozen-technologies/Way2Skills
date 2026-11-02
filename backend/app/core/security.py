from datetime import datetime, timedelta, timezone
import secrets

import jwt
from pwdlib import PasswordHash

from app.core.config import Settings

password_hash = PasswordHash.recommended()
_dummy_password_hash = password_hash.hash(secrets.token_urlsafe(32))


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded_hash: str) -> bool:
    return password_hash.verify(password, encoded_hash)


def create_access_token(subject: str, settings: Settings) -> tuple[str, int]:
    expires_in = settings.jwt_access_token_minutes * 60
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": subject,
            "iat": now,
            "exp": now + timedelta(seconds=expires_in),
            "type": "access",
        },
        settings.signing_key(),
        algorithm="HS256",
    )
    return token, expires_in


def decode_access_token(token: str, settings: Settings) -> str | None:
    try:
        payload = jwt.decode(
            token,
            settings.signing_key(),
            algorithms=["HS256"],
            options={"require": ["sub", "exp", "type"]},
        )
    except jwt.InvalidTokenError:
        return None
    subject = payload.get("sub")
    if payload.get("type") != "access" or not isinstance(subject, str):
        return None
    return subject


def verify_unknown_admin_password(password: str) -> None:
    password_hash.verify(password, _dummy_password_hash)
