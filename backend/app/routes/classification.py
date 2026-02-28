"""
Waste classification API routes.

POST /api/v1/classify  — accepts a base64 image, returns classification + disposal instructions
"""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import verify_google_token
from app.schemas.classification import (
    ClassificationRequest,
    ClassificationResponse,
)
from app.services.gemini_service import GeminiClassificationService

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
    try:
        service = GeminiClassificationService()
        items, instructions, processing_time = await service.classify_and_advise(
            image_base64=request.image_base64,
            user_location=request.location,
        )

        return ClassificationResponse(
            items=items,
            disposal_instructions=instructions,
            total_items=len(items),
            processing_time_ms=processing_time,
        )

    except ValueError as e:
        # Config errors (missing API key) or JSON parse failures
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")
