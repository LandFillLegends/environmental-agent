"""Daily background task to delete expired cache entries."""
import logging
from app.database import SessionLocal
from app.services.cache_service import DisposalCacheService

logger = logging.getLogger(__name__)


def cleanup_expired_cache():
    """Delete all expired disposal cache entries."""
    db = SessionLocal()
    cache_service = DisposalCacheService(db)

    try:
        deleted = cache_service.cleanup_expired_sync()
        db.commit()
        logger.info("Cache cleanup complete — deleted %d expired entries", deleted)
        print(f"✓ Cleaned up {deleted} expired cache entries")
    except Exception as e:
        logger.error("Cache cleanup failed: %s", e, exc_info=True)
        db.rollback()
        print(f"✗ Cache cleanup failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_expired_cache()
