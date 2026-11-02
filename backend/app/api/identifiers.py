from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.identifiers import UUIDPrimaryKeyMixin

ModelT = TypeVar("ModelT", bound=UUIDPrimaryKeyMixin)


def get_record_by_id(
    session: Session, model: type[ModelT], record_id: str
) -> ModelT | None:
    try:
        identifier = UUID(record_id)
    except ValueError:
        if not record_id.isdecimal() or int(record_id) < 1:
            raise HTTPException(
                status_code=422,
                detail="ID must be a UUID or a positive legacy integer",
            )
        return session.scalar(select(model).where(model.legacy_id == int(record_id)))
    return session.get(model, identifier)
