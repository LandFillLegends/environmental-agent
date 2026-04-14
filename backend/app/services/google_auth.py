"""
Google OAuth credential helpers shared across calendar and other routes
that need to interact with Google APIs on behalf of a user.
"""
import logging

from fastapi import HTTPException
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def build_google_credentials(db_user: User) -> Credentials:
    """Construct a Google Credentials object from stored token fields."""
    return Credentials(
        token=db_user.google_access_token,
        refresh_token=db_user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
    )


def refresh_credentials_if_needed(creds: Credentials, db_user: User, db: Session) -> Credentials:
    """Refresh expired credentials and persist the new token back to the DB."""
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            db_user.google_access_token = creds.token
            db_user.google_token_expiry = creds.expiry
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="Google credential invalid or expired")
    return creds


def get_user_with_google_tokens(user: dict, db: Session) -> User:
    """
    Load the DB user and assert they have a Google refresh token.
    Raises 401 if the user is not found or has not connected Google Calendar.
    """
    try:
        db_user = db.query(User).filter(User.id == user["sub"]).first()

        if not db_user:
            raise HTTPException(
                status_code=401,
                detail="Google Calendar not connected. Please sign in and connect your Google account.",
            )
        if not db_user.google_refresh_token:
            raise HTTPException(
                status_code=401,
                detail="Google Calendar not connected. Please reconnect your Google account.",
            )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500
            detail="Sorry, something went wrong with Google Calendar integration. Please try again.",
        )
    
    return db_user
