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
import requests
from jose import jwt, JWTError, jwk
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
        token = credentials.credentials
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        kid = unverified_header.get("kid")

        if alg == "HS256":
            if not settings.SUPABASE_JWT_SECRET:
                raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET is not configured")
            key = settings.SUPABASE_JWT_SECRET
            algorithms = ["HS256"]
        elif alg in ("RS256", "ES256"):
            if not settings.SUPABASE_URL:
                raise HTTPException(status_code=500, detail="SUPABASE_URL is required to verify RS256/ES256 tokens")

            jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            resp = requests.get(jwks_url, timeout=5)
            resp.raise_for_status()
            jwks = resp.json().get("keys", [])

            key_data = next((k for k in jwks if k.get("kid") == kid), None)
            if not key_data:
                raise HTTPException(status_code=401, detail="No matching JWK key found")

            key = jwk.construct(key_data)
            algorithms = [alg]
        else:
            raise HTTPException(status_code=401, detail=f"Unsupported JWT algorithm: {alg}")

        payload = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Supabase JWKS: {str(e)}")