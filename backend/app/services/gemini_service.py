"""
Gemini-powered waste classification service.

Two-step pipeline:
1. classify_image()  — sends photo to Gemini, gets structured item data (JSON)
2. get_disposal_instructions() — sends that data back to Gemini, gets human-readable disposal advice
"""
import json
from typing import Dict, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from app.core.config import settings
from app.schemas.classification import WasteClassificationItem

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

If multiple items are identified, return one object per item.\
"""


# ── Service ──────────────────────────────────────────────────────────────────
def parse_json_response(text: str) -> List[Dict]:
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
    
        # Switch to Langchain Google SDK
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY
        )

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

        # Build the prompt (add location context if provided)
        prompt = CLASSIFICATION_PROMPT
        if user_location:
            prompt += f"\n\nThe user's location is: {user_location}"

        # LangChain message format for multimodal input
        message = HumanMessage(content=[
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
            },
        ])

        response = await self.model.ainvoke([message])
        items_data = parse_json_response(response.content)
        return [WasteClassificationItem(**item) for item in items_data]

    async def classify_text(
        self,
        message: str,
        user_location: Optional[str] = None,
    ) -> List[WasteClassificationItem]:
        """
        Step 1: Send the user's text input to Gemini and get structured waste classification data.

        Args:
            message: The user's input prompt.
            user_location: Optional location string to help with localized rules.

        Returns:
            A list of WasteClassificationItem objects (one per detected item).
        """
        prompt = CLASSIFICATION_PROMPT

        if user_location:
            prompt += f"\n\nThe user's location is: {user_location}"
        
        prompt += f"\n\nThe user's prompt is as follows: {message}"

        messages = [HumanMessage(content=prompt)]
        response = await self.model.ainvoke(messages)

        items_data = parse_json_response(response.content)
        return [WasteClassificationItem(**item) for item in items_data]
    