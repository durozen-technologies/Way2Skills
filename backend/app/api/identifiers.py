from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.identifiers import UUIDPrimaryKeyMixin

ModelT = TypeVar("ModelT", bound=UUIDPrimaryKeyMixin)


def get_record_by_id(
    session: Session, model: type[ModelT], record_id: str
) -> ModelT | None:
    try:
        identifier = UUID(record_id)
    except ValueError:
        if record_id.isdecimal() and int(record_id) > 0:
            return None
        raise HTTPException(status_code=422, detail="ID must be a UUID")
    return session.get(model, identifier)
