"""
Waste classification API routes.

POST /api/v1/classify        — accepts a base64 image or text, invokes agentic loop, returns classification + disposal instructions
POST /api/v1/classify/stream — same pipeline, streams SSE progress events as each LangGraph node completes
"""

import json
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.core.auth import get_current_user
from app.schemas.classification import (
    ClassificationRequest,
    ClassificationResponse,
)
from app.services.agent import agent
from app.services.location_service import get_location_from_ip

logger = logging.getLogger(__name__)

# Create a router with a URL prefix and a tag (shows up in auto-generated docs)
router = APIRouter(prefix="/api/v1", tags=["classification"])


@router.post("/classify", response_model=ClassificationResponse)
async def classify_waste_input(
    request: ClassificationRequest,
    raw_request: Request,
#    user: dict = Depends(verify_google_token),
    user: dict = Depends(get_current_user),
):
    """
    Classify waste items in a photo or text and get disposal instructions.

    Flow:
    1. FastAPI validates the request body against ClassificationRequest
    2. get_current_user checks auth (bypassed in dev)
    3. We call Gemini twice: classify → disposal advice
    4. FastAPI validates the response against ClassificationResponse and returns JSON

    The 'user' param is injected by the auth dependency — you can use it
    to log who made the request, rate-limit per user, etc.
    """
    start_time = time.time()

    has_image = bool(request.image_base64)
    has_message = bool(request.message)
    logger.info(
        "Classify request received — has_image=%s has_message=%s location_provided=%s",
        has_image, has_message, bool(request.location),
    )

    try:
        # Determine location: use provided value or fall back to IP geolocation
        location = request.location
        if location:
            logger.info("Using client-provided location: %r", location)
        else:
            forwarded_for = raw_request.headers.get("X-Forwarded-For", "")
            client_ip = forwarded_for.split(",")[0].strip() or raw_request.client.host
            logger.info(
                "No location in request — resolving from IP. X-Forwarded-For=%r client.host=%r → using IP=%r",
                forwarded_for, raw_request.client.host, client_ip,
            )
            location = await get_location_from_ip(client_ip)
            logger.info("IP-resolved location: %r", location)

        logger.info("Final location passed to agent: %r", location)

        # Invoke agentic loop
        result = await agent.ainvoke({
            "image_base64": request.image_base64,
            "message": request.message,
            "location": location,
        })

        processing_time_ms = (time.time() - start_time) * 1000
        total_items = len(result["items"])
        logger.info(
            "Classification complete — total_items=%d processing_time_ms=%.1f",
            total_items, processing_time_ms,
        )

        return ClassificationResponse(
            items=result["items"],
            disposal_instructions=result["disposal_instructions"],
            total_items=total_items,
            processing_time_ms=processing_time_ms,
        )

    except ValueError as e:
        # Config errors (missing API key), JSON parse failures, or input errors
        logger.error("Validation error during classification: %s", e, exc_info=True)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error during classification: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")


@router.post("/classify/stream")
async def classify_waste_stream(
    request: ClassificationRequest,
    raw_request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Same pipeline as /classify but streams SSE progress events as each node completes.

    Events:
      {"type": "step", "step": 0}  — classification started
      {"type": "step", "step": 1}  — item identified, searching local rules
      {"type": "step", "step": 2}  — disposal agent finished, preparing response
      {"type": "done", "result": {...}}  — full ClassificationResponse payload
      {"type": "error", "message": "..."}  — pipeline failed
    """
    start_time = time.time()

    location = request.location
    if not location:
        forwarded_for = raw_request.headers.get("X-Forwarded-For", "")
        client_ip = forwarded_for.split(",")[0].strip() or raw_request.client.host
        location = await get_location_from_ip(client_ip)

    logger.info(
        "Stream classify request — has_image=%s has_message=%s location=%r",
        bool(request.image_base64), bool(request.message), location,
    )

    async def generate():
        items = []
        disposal_instructions = []

        yield f"data: {json.dumps({'type': 'step', 'step': 0})}\n\n"

        try:
            async for chunk in agent.astream(
                {
                    "image_base64": request.image_base64,
                    "message": request.message,
                    "location": location,
                },
                stream_mode="updates",
            ):
                node_name = next(iter(chunk))
                node_output = chunk[node_name]

                if node_name in ("image_classification", "text_classification"):
                    items = node_output.get("items", [])
                    yield f"data: {json.dumps({'type': 'step', 'step': 1})}\n\n"

                elif node_name == "disposal_agent" and node_output.get("disposal_instructions"):
                    disposal_instructions = node_output["disposal_instructions"]
                    yield f"data: {json.dumps({'type': 'step', 'step': 2})}\n\n"

            processing_time_ms = (time.time() - start_time) * 1000
            result = ClassificationResponse(
                items=items,
                disposal_instructions=disposal_instructions,
                total_items=len(items),
                processing_time_ms=processing_time_ms,
            )
            yield f"data: {json.dumps({'type': 'done', 'result': result.model_dump(mode='json')})}\n\n"

        except Exception as e:
            logger.error("Stream classification error: %s", e, exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
