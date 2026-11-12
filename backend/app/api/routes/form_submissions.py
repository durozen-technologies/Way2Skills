import json
import logging
from urllib.parse import parse_qs
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import HTMLResponse

from app.core.config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)
MAX_SUBMISSION_SIZE = 16_384


@router.post("")
async def submit_form(request: Request) -> HTMLResponse:
    settings = get_settings()
    endpoint = settings.way2skills_apps_script_web_app_url
    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Form submission is not configured.",
        )

    content_length = request.headers.get("content-length")
    if content_length:
        try:
            declared_size = int(content_length)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid content length.",
            ) from exc
        if declared_size > MAX_SUBMISSION_SIZE:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
    body = await request.body()
    if len(body) > MAX_SUBMISSION_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

    try:
        fields = parse_qs(body.decode("utf-8"), strict_parsing=True)
    except (UnicodeDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid form submission.",
        ) from exc

    if set(fields) != {"payload", "requestId", "responseOrigin"} or any(
        len(values) != 1 for values in fields.values()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid form submission.",
        )

    payload_text = fields["payload"][0]
    request_id = fields["requestId"][0]
    response_origin = fields["responseOrigin"][0]
    try:
        payload = json.loads(payload_text)
        UUID(request_id)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid form submission.",
        ) from exc
    if (
        not isinstance(payload, dict)
        or payload.get("formType") not in {"contact", "admission"}
        or response_origin not in settings.allowed_origins()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid form submission.",
        )

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.post(
                endpoint,
                data={
                    "payload": payload_text,
                    "requestId": request_id,
                    "responseOrigin": response_origin,
                },
            )
    except httpx.TimeoutException as exc:
        logger.warning("Apps Script form submission timed out")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Form submission timed out.",
        ) from exc
    except httpx.RequestError as exc:
        logger.warning("Apps Script form submission request failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Form submission service is unavailable.",
        ) from exc

    if not response.is_success or "text/html" not in response.headers.get(
        "content-type", ""
    ).lower():
        logger.warning(
            "Apps Script form submission returned an unexpected response: status=%s",
            response.status_code,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Form submission service returned an unexpected response.",
        )

    return HTMLResponse(
        content=response.text,
        headers={"Cache-Control": "no-store"},
    )
