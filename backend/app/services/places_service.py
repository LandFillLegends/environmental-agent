"""Google Places API integration for enriching disposal facilities with coordinates."""

import asyncio
import logging
from typing import List, Optional

import httpx

from app.core.config import settings
from app.schemas.classification import DisposalFacility

logger = logging.getLogger(__name__)

PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"


async def enrich_facility(
    name: str,
    address: str,
    user_location: Optional[str] = None,
) -> DisposalFacility:
    """Look up a facility via Google Places Text Search (New) API and return enriched data.

    If the API key is missing or the request fails, returns an unenriched facility
    with just the name and address from Gemini.
    """
    if not settings.GOOGLE_PLACES_API_KEY:
        return DisposalFacility(name=name, address=address)

    query = f"{name} {address}"
    if user_location:
        query += f" near {user_location}"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": (
            "places.displayName,places.formattedAddress,places.location,"
            "places.id,places.nationalPhoneNumber,places.rating,places.websiteUri"
        ),
    }

    body = {"textQuery": query, "maxResultCount": 1}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(PLACES_TEXT_SEARCH_URL, headers=headers, json=body)
            resp.raise_for_status()

        data = resp.json()
        places = data.get("places", [])
        if not places:
            return DisposalFacility(name=name, address=address)

        place = places[0]
        location = place.get("location", {})

        return DisposalFacility(
            name=place.get("displayName", {}).get("text", name),
            address=place.get("formattedAddress", address),
            latitude=location.get("latitude"),
            longitude=location.get("longitude"),
            place_id=place.get("id"),
            phone=place.get("nationalPhoneNumber"),
            rating=place.get("rating"),
            website=place.get("websiteUri"),
        )
    except Exception as e:
        logger.warning("Places API lookup failed for '%s': %s", name, e)
        return DisposalFacility(name=name, address=address)


async def enrich_facilities(
    raw_facilities: List[dict],
    user_location: Optional[str] = None,
) -> List[DisposalFacility]:
    """Enrich a list of raw facility dicts (name + address) concurrently."""
    tasks = [
        enrich_facility(
            name=f.get("name", "Unknown"),
            address=f.get("address", ""),
            user_location=user_location,
        )
        for f in raw_facilities
    ]
    return list(await asyncio.gather(*tasks))
