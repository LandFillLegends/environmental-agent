"""
Gemini-powered waste classification service.

Two-step pipeline:
1. classify_image()  — sends photo to Gemini, gets structured item data (JSON)
2. get_disposal_instructions() — sends that data back to Gemini, gets human-readable disposal advice

Uses the new `google-genai` SDK (replaces the deprecated `google-generativeai`).
"""

import base64
import json
import time
from typing import Dict, List, Optional, Tuple

from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.classification import DisposalInstruction, WasteClassificationItem

# ── Prompts ──────────────────────────────────────────────────────────────────

CLASSIFICATION_PROMPT = """\
You are a Waste Sorting Intelligence Specialist. Your goal is to identify items \
from user input and extract the specific material properties needed to query \
local disposal regulations.

Input Processing Instructions:
1. Identify the Object: Determine exactly what the item is (e.g., "yogurt container," "LED lightbulb," "pizza box").
2. Analyze Material Composition: Break the item down into its primary materials (e.g., PET plastic #1, Corrugated Cardboard, Lithium-ion battery).
3. Detect Contaminants: Identify if the item is soiled (e.g., "greasy," "half-full of liquid") as this changes disposal rules.
4. Extract Location: Look for a City, State, or ZIP code in the text or image. If missing, set location to null.

Constraint: Do not give disposal advice yet. Your only job is to provide structured data for a search tool.

Return ONLY a JSON array (no markdown fences, no explanation) where each element is:
{
  "item_name": "string",
  "material_type": "string",
  "is_hazardous": boolean,
  "is_soiled": boolean,
  "search_query": "An optimized search string for local recycling rules",
  "location": "string or null",
  "confidence_score": 0.0-1.0
}

If multiple items are visible, return one object per item.\
"""

DISPOSAL_PROMPT = """\
You are a Waste Disposal Advisor. Given the following classified waste items, \
provide clear, concise disposal instructions for each one.

Items to advise on:
{items_json}

For each item, return a JSON array (no markdown fences, no explanation) where each element is:
{{
  "item_name": "string (must match the input)",
  "material_type": "string (must match the input)",
  "instruction": "string - 1-3 sentences of practical disposal advice"
}}

Be specific about whether to recycle, compost, or landfill. \
Mention any special handling for hazardous or soiled items.\
"""


# ── Service ──────────────────────────────────────────────────────────────────


def _parse_json_response(text: str) -> List[Dict]:
    """
    Parse JSON from Gemini's response, stripping markdown code fences if present.

    Gemini sometimes wraps JSON in ```json ... ``` even when told not to.
    This handles that gracefully.
    """
    cleaned = text.strip()

    # Strip markdown code fences
    if cleaned.startswith("```"):
        # Remove first line (```json or ```) and last line (```)
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1]).strip()

    return json.loads(cleaned)


class GeminiClassificationService:
    """Talks to Gemini to classify waste items and generate disposal instructions."""

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set. Add it to your .env file."
            )
        # New SDK: create a Client instead of calling configure()
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.5-flash"

    async def classify_image(
        self,
        image_base64: str,
        user_location: Optional[str] = None,
    ) -> List[WasteClassificationItem]:
        """
        Step 1: Send an image to Gemini and get structured waste classification data.

        Args:
            image_base64: The image encoded as a base64 string.
            user_location: Optional location string to help with localized rules.

        Returns:
            A list of WasteClassificationItem objects (one per detected item).
        """
        # Strip data URI prefix if present.
        # Cameras/browsers sometimes send "data:image/jpeg;base64,/9j/4AAQ..."
        # We only want the part after the comma.
        if "," in image_base64[:100]:
            image_base64 = image_base64.split(",", 1)[1]

        # Fix padding — base64 strings must be a multiple of 4 chars.
        # If truncated, adding "=" padding fixes it.
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += "=" * (4 - missing_padding)

        image_bytes = base64.b64decode(image_base64)

        # Build the prompt (add location context if provided)
        prompt = CLASSIFICATION_PROMPT
        if user_location:
            prompt += f"\n\nThe user's location is: {user_location}"

        # New SDK: pass content parts as a list to generate_content
        # types.Part.from_bytes() creates an image part from raw bytes
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
        )

        # Parse the JSON response into our Pydantic models
        items_data = _parse_json_response(response.text)
        return [WasteClassificationItem(**item) for item in items_data]

    async def get_disposal_instructions(
        self,
        items: List[WasteClassificationItem],
    ) -> List[DisposalInstruction]:
        """
        Step 2: Take classification results and ask Gemini for disposal advice.

        This is a text-only call (no image needed) — we just pass the structured
        data from step 1 and ask for human-readable instructions.
        """
        # Convert items to JSON for the prompt
        items_json = json.dumps(
            [item.model_dump() for item in items],
            indent=2,
        )

        prompt = DISPOSAL_PROMPT.format(items_json=items_json)

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        instructions_data = _parse_json_response(response.text)
        return [DisposalInstruction(**inst) for inst in instructions_data]

    async def classify_and_advise(
        self,
        image_base64: str,
        user_location: Optional[str] = None,
    ) -> Tuple[List[WasteClassificationItem], List[DisposalInstruction], float]:
        """
        Full pipeline: classify image → generate disposal instructions.

        Returns:
            (items, disposal_instructions, processing_time_ms)
        """
        start = time.time()

        items = await self.classify_image(image_base64, user_location)
        instructions = await self.get_disposal_instructions(items)

        elapsed_ms = (time.time() - start) * 1000
        return items, instructions, elapsed_ms
