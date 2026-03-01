"""
Waste classification API routes.

POST /api/v1/classify  — accepts a base64 image or text, invokes agenti loop, returns classification + disposal instructions
"""

from fastapi import APIRouter, Depends, HTTPException
import time

from app.core.auth import verify_google_token
from app.schemas.classification import (
    ClassificationRequest,
    ClassificationResponse,
)
from app.services.agent import agent

# Create a router with a URL prefix and a tag (shows up in auto-generated docs)
router = APIRouter(prefix="/api/v1", tags=["classification"])


@router.post("/classify", response_model=ClassificationResponse)
async def classify_waste_image(
    request: ClassificationRequest,
    user: dict = Depends(verify_google_token),
):
    """
    Classify waste items in a photo and get disposal instructions.

    Flow:
    1. FastAPI validates the request body against ClassificationRequest
    2. verify_google_token checks auth (bypassed in dev)
    3. We call Gemini twice: classify → disposal advice
    4. FastAPI validates the response against ClassificationResponse and returns JSON

    The 'user' param is injected by the auth dependency — you can use it
    to log who made the request, rate-limit per user, etc.
    """
    start_time = time.time()

    try:
        result = await agent.ainvoke({
            "image_base64": request.image_base64,
            "message": request.message,
            "location": request.location,
        })

        processing_time_ms = (time.time() - start_time) * 1000

        return ClassificationResponse(
            items=result["items"],
            disposal_instructions=result["disposal_instructions"],
            total_items=len(result["items"]),
            processing_time_ms=processing_time_ms,
        )

    except ValueError as e:
        # Config errors (missing API key), JSON parse failures, or input errors
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")
