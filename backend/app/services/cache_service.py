"""
Disposal instruction caching service with LangChain tool integration.

Provides:
1. CacheLookupTool - LangChain tool for Gemini to check cache
2. DisposalCacheService - Database operations (lookup, save, cleanup)
"""

from typing import Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
import logging

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.models.disposal_cache import DisposalCache
from app.schemas.classification import DisposalInstruction
from app.database import SessionLocal

logger = logging.getLogger(__name__)

CACHE_TTL_DAYS = 30

# ─── Pydantic Schema for Tool Input ───────────────────────────────────


class CacheLookupInput(BaseModel):
    """Input schema for cache lookup tool."""
    location: str = Field(..., description="User's location (city, state, ZIP)")
    item_name: str = Field(..., description="Name of the waste item (e.g., 'plastic water bottle')")
    material_type: str = Field(..., description="Material type (e.g., 'PET plastic #1')")


# ─── LangChain Tool Definition ────────────────────────────────────────


@tool(args_schema=CacheLookupInput)
def cache_lookup_tool(location: str, item_name: str, material_type: str) -> str:
    """
    Check if disposal instructions for this item + location are already cached.

    Returns cached disposal instructions if available and not expired (< 30 days old).
    Use this BEFORE searching the web to save time and API costs.

    If cache hit: Returns full disposal instructions with facilities.
    If cache miss: Returns "No cached data found" - then use web search.

    Cache age is included in response - if data is >7 days old, consider verifying with fresh search.
    """
    db = SessionLocal()
    service = DisposalCacheService(db)

    try:
        result = service.get_cached_instruction_sync(location, item_name, material_type)
        db.commit()  # Commit hit_count update

        if result:
            instruction, age_days = result

            # Format response for Gemini
            facilities_str = "\n".join([
                f"  - {f.name}, {f.address}" +
                (f" (lat: {f.latitude}, lng: {f.longitude})" if f.latitude else "")
                for f in instruction.facilities
            ])

            response = f"""CACHE HIT (age: {age_days} days, expires in {30 - age_days} days)

Item: {instruction.item_name}
Material: {instruction.material_type}

Disposal Instructions:
{instruction.instruction}

Facilities:
{facilities_str}

Note: Data is {age_days} days old. {'Consider verifying with fresh search if policies may have changed.' if age_days > 7 else 'Data is recent.'}"""

            return response
        else:
            return "No cached data found. Use web search to get current disposal instructions."

    except Exception as e:
        logger.error("Cache lookup tool failed: %s", e, exc_info=True)
        return f"Cache lookup error: {e}. Proceed with web search."
    finally:
        db.close()


# ─── Cache Service (Database Operations) ──────────────────────────────


class DisposalCacheService:
    """Service for caching disposal instructions."""

    def __init__(self, db: Session):
        self.db = db

    def _normalize_key(self, location: str, item_name: str, material_type: str) -> Tuple[str, str, str]:
        """Normalize cache key components to lowercase for consistent lookups."""
        return (
            location.strip().lower(),
            item_name.strip().lower(),
            material_type.strip().lower()
        )

    def get_cached_instruction_sync(
        self,
        location: str,
        item_name: str,
        material_type: str
    ) -> Optional[Tuple[DisposalInstruction, int]]:
        """
        Synchronous cache lookup (for tool usage).

        Returns:
            (DisposalInstruction, age_in_days) if found and not expired
            None if cache miss or expired
        """
        loc_key, item_key, mat_key = self._normalize_key(location, item_name, material_type)

        try:
            stmt = select(DisposalCache).where(
                DisposalCache.location == loc_key,
                DisposalCache.item_name == item_key,
                DisposalCache.material_type == mat_key,
                DisposalCache.expires_at > datetime.now(timezone.utc)
            )
            cache_entry = self.db.execute(stmt).scalar_one_or_none()

            if not cache_entry:
                logger.info("Cache MISS — location=%r item=%r material=%r", location, item_name, material_type)
                return None

            # Update access metadata
            cache_entry.hit_count += 1
            cache_entry.last_accessed_at = datetime.now(timezone.utc)
            self.db.add(cache_entry)

            age_days = (datetime.now(timezone.utc) - cache_entry.created_at).days

            logger.info(
                "Cache HIT — location=%r item=%r material=%r age_days=%d hit_count=%d",
                location, item_name, material_type, age_days, cache_entry.hit_count
            )

            # Deserialize JSONB to DisposalInstruction
            instruction = DisposalInstruction(**cache_entry.disposal_data)

            return (instruction, age_days)

        except Exception as e:
            logger.error("Cache lookup failed: %s", e, exc_info=True)
            return None

    def save_instruction_sync(
        self,
        location: str,
        instruction: DisposalInstruction,
        ttl_days: int = CACHE_TTL_DAYS
    ) -> bool:
        """
        Save disposal instruction to cache with TTL (synchronous).

        Returns True if saved successfully, False on error.
        """
        loc_key, item_key, mat_key = self._normalize_key(
            location, instruction.item_name, instruction.material_type
        )

        try:
            disposal_data = instruction.model_dump()
            expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)

            # Check if exists
            stmt = select(DisposalCache).where(
                DisposalCache.location == loc_key,
                DisposalCache.item_name == item_key,
                DisposalCache.material_type == mat_key,
            )
            existing = self.db.execute(stmt).scalar_one_or_none()

            if existing:
                # Update
                existing.disposal_data = disposal_data
                existing.expires_at = expires_at
                existing.created_at = datetime.now(timezone.utc)
                self.db.add(existing)
                logger.info("Cache UPDATE — location=%r item=%r", location, instruction.item_name)
            else:
                # Insert
                cache_entry = DisposalCache(
                    location=loc_key,
                    item_name=item_key,
                    material_type=mat_key,
                    disposal_data=disposal_data,
                    expires_at=expires_at,
                )
                self.db.add(cache_entry)
                logger.info("Cache INSERT — location=%r item=%r ttl_days=%d", location, instruction.item_name, ttl_days)

            return True

        except Exception as e:
            logger.error("Cache save failed: %s", e, exc_info=True)
            return False

    def cleanup_expired_sync(self) -> int:
        """Delete expired cache entries (synchronous). Returns count."""
        try:
            stmt = delete(DisposalCache).where(
                DisposalCache.expires_at <= datetime.now(timezone.utc)
            ).returning(DisposalCache.id)

            result = self.db.execute(stmt)
            deleted_count = len(result.fetchall())

            logger.info("Cache cleanup — deleted %d expired entries", deleted_count)
            return deleted_count

        except Exception as e:
            logger.error("Cache cleanup failed: %s", e, exc_info=True)
            return 0
