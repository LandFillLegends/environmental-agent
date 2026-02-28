from pydantic import BaseModel, Field
from typing import List, Optional


class WasteClassificationItem(BaseModel):
    """A single classified waste item — matches the Gemini structured output."""
    item_name: str = Field(..., description="Common name of the identified item")
    material_type: str = Field(..., description="Primary material (e.g. PET plastic #1, corrugated cardboard)")
    is_hazardous: bool = Field(default=False, description="Whether the item contains hazardous materials")
    is_soiled: bool = Field(default=False, description="Whether the item is contaminated/soiled")
    search_query: str = Field(..., description="Optimized search string for local recycling rules")
    location: Optional[str] = Field(None, description="Location detected from packaging/labels, or null")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Model confidence from 0.0 to 1.0")


class DisposalInstruction(BaseModel):
    """Human-readable disposal instruction for one item."""
    item_name: str
    material_type: str
    instruction: str = Field(..., description="Plain-language disposal/recycling instructions")


class ClassificationRequest(BaseModel):
    """What the frontend sends: a base64 image or text and optional location."""
    image_base64: Optional[str] = Field(None, description="Base64-encoded image (JPEG or PNG)")
    message: Optional[str] = Field(None, description="Text description of waste item(s)")
    location: Optional[str] = Field(None, description="User's location for localized disposal rules")


class ClassificationResponse(BaseModel):
    """What the API returns: classifications + disposal instructions."""
    items: List[WasteClassificationItem]
    disposal_instructions: List[DisposalInstruction]
    total_items: int
    processing_time_ms: float
