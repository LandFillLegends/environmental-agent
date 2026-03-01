"""
Auth dependency using Supabase JWT verification.

Usage in any route:
    @router.get("/my-endpoint")
    async def my_endpoint(user: dict = Depends(get_current_user)):
        # 'user' contains the decoded JWT payload including user["sub"] (user ID)
        # If auth fails, this code never runs — FastAPI returns 401 automatically

In development (BYPASS_AUTH=True): returns a fake user so you can test without OAuth.
In production (BYPASS_AUTH=False): validates the Supabase JWT using SUPABASE_JWT_SECRET.
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    FastAPI dependency that verifies a Supabase JWT token.
    In development (BYPASS_AUTH=True): returns a fake user so you can test without OAuth.
    In production (BYPASS_AUTH=False): validates the JWT using SUPABASE_JWT_SECRET.
    """

    # --- Development bypass ---
    if settings.BYPASS_AUTH:
        return {
            "email": "dev@example.com",
            "sub": "dev_user_123",
            "name": "Development User",
        }

    # --- Production: require and verify a real Supabase JWT ---
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization token required")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")