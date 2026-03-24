from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/v1", tags=["calendar"])

class ScheduleRequest(BaseModel):
    facility_name: str
    facility_address: str
    date: str        # ISO format e.g. "2026-03-15"
    time: str        # e.g. "10:00"
    waste_item: str  # e.g. "old car battery"

@router.post("/schedule")
async def schedule_disposal(
    request: ScheduleRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db_user = db.query(User).filter(User.id == user["sub"]).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        if not db_user.google_refresh_token:
            raise HTTPException(
                status_code=401,
                detail="Google Calendar OAuth token missing; please connect your Google account",
            )

        # parse and validate requested time
        try:
            start_dt = datetime.fromisoformat(f"{request.date}T{request.time}")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date or time format")

        end_dt = start_dt + timedelta(hours=1)

        # Prepare Google credentials
        creds = Credentials(
            token=db_user.google_access_token,
            refresh_token=db_user.google_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
        )

        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                db_user.google_access_token = creds.token
                db_user.google_token_expiry = creds.expiry
                db.commit()
            else:
                raise HTTPException(status_code=401, detail="Google credential invalid or expired")

        event = {
            "summary": f"Dispose: {request.waste_item}",
            "location": request.facility_address,
            "description": f"Drop off {request.waste_item} at {request.facility_name}",
            "start": {
                "dateTime": start_dt.isoformat(),
                "timeZone": "America/New_York",
            },
            "end": {
                "dateTime": end_dt.isoformat(),
                "timeZone": "America/New_York",
            },
        }

        calendar_service = build("calendar", "v3", credentials=creds)
        created = calendar_service.events().insert(calendarId="primary", body=event).execute()

        return {"status": "scheduled", "event": created}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduling failed: {e}")