"""
Google OAuth token verification dependency.

Usage in any route:
    @router.post("/my-endpoint")
    async def my_endpoint(user: dict = Depends(verify_google_token)):
        # 'user' is a dict with the Google user info
        # If auth fails, this code never runs — FastAPI returns 401 automatically

Your friend is building the full OAuth flow on another branch.
This file just verifies that an incoming Bearer token is legit by asking Google.
"""

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import httpx

from app.core.config import settings

# HTTPBearer extracts the token from the "Authorization: Bearer <token>" header.
# auto_error=False means it won't crash if no token is sent — we handle that ourselves.
security = HTTPBearer(auto_error=False)


async def verify_google_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> dict:
    """
    FastAPI dependency that verifies a Google OAuth access token.

    In development (BYPASS_AUTH=True): returns a fake user so you can test without OAuth.
    In production (BYPASS_AUTH=False): validates the token with Google's tokeninfo endpoint.
    """

    # --- Development bypass ---
    if settings.BYPASS_AUTH:
        return {
            "email": "dev@landfilllegends.com",
            "sub": "dev_user_123",
            "name": "Development User",
        }

    # --- Production: require and verify a real token ---
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization token required")

    token = credentials.credentials

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?access_token={token}"
        )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_info = response.json()

        # If we have a client ID configured, verify the token was issued for our app
        if settings.GOOGLE_OAUTH_CLIENT_ID:
            if user_info.get("aud") != settings.GOOGLE_OAUTH_CLIENT_ID:
                raise HTTPException(
                    status_code=401,
                    detail="Token was not issued for this application",
                )

        return user_info
