from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.redis import get_redis

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint that verifies:
    1. API is running
    2. Database connection is working
    3. Redis connection is working
    """
    try:
        # Check database connection
        await db.execute("SELECT 1")
        
        # Check Redis connection
        redis = await get_redis()
        await redis.ping()
        
        return {
            "status": "healthy",
            "services": {
                "api": "up",
                "database": "up",
                "redis": "up"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "services": {
                "api": "up",
                "database": "down" if "db" in str(e).lower() else "up",
                "redis": "down" if "redis" in str(e).lower() else "up"
            }
        } 