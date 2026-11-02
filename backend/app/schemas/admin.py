from pydantic import BaseModel


class DashboardResponse(BaseModel):
    contacts_total: int
    contacts_new: int
    admissions_total: int
    admissions_pending: int


class PageResponse(BaseModel):
    items: list[dict[str, object]]
    total: int
    limit: int
    offset: int
