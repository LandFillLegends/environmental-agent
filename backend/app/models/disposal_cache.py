"""Disposal instruction cache model for PostgreSQL storage."""

from sqlalchemy import Column, String, DateTime, Index, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.database import Base


class DisposalCache(Base):
    """Cache table for storing disposal instructions with enriched facility data.

    Cache key: location + item_name + material_type (normalized lowercase)
    Cache value: Full DisposalInstruction with enriched DisposalFacility[] (lat/lng, phone, rating, website)
    TTL: 30 days (disposal policies change infrequently)
    """
    __tablename__ = "disposal_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Cache key components (normalized, indexed)
    location = Column(String(255), nullable=False, index=True)
    item_name = Column(String(255), nullable=False, index=True)
    material_type = Column(String(255), nullable=False, index=True)

    # Cached data (JSONB stores full DisposalInstruction with enriched facilities)
    disposal_data = Column(JSONB, nullable=False)

    # Expiration and analytics
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    hit_count = Column(Integer, default=0, nullable=False)
    last_accessed_at = Column(DateTime(timezone=True))

    __table_args__ = (
        # Composite unique index for cache lookups
        Index('idx_disposal_cache_lookup', 'location', 'item_name', 'material_type', unique=True),
        # Index for TTL cleanup queries
        Index('idx_disposal_cache_expiry', 'expires_at'),
    )
