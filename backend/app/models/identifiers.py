from uuid import UUID, uuid4

from sqlalchemy import Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    legacy_id: Mapped[int | None] = mapped_column(Integer, nullable=True, unique=True)
