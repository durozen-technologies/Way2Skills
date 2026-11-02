import asyncio
import logging

from fastapi import Request
from sqlalchemy.exc import ProgrammingError, SQLAlchemyError

from app.main import app


def test_database_errors_log_safe_diagnostics_without_query_parameters(caplog):
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/admin/courses",
            "headers": [],
            "query_string": b"",
            "server": ("testserver", 80),
            "client": ("127.0.0.1", 12345),
            "scheme": "http",
        }
    )
    sensitive_value = "private-course-description"
    error = ProgrammingError(
        "INSERT INTO courses (full_description) VALUES (%(full_description)s)",
        {"full_description": sensitive_value},
        RuntimeError("UndefinedTable"),
    )
    handler = app.exception_handlers[SQLAlchemyError]

    with caplog.at_level(logging.ERROR):
        response = asyncio.run(handler(request, error))

    assert response.status_code == 503
    assert "Database operation unavailable" in response.body.decode()
    assert "POST" in caplog.text
    assert "/api/admin/courses" in caplog.text
    assert "ProgrammingError" in caplog.text
    assert sensitive_value not in caplog.text
    assert "INSERT INTO courses" not in caplog.text
