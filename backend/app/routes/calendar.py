import json
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["calendar"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ScheduleRequest(BaseModel):
    facility_name: str
    facility_address: str
    date: str       # ISO format e.g. "2026-04-07"
    time: str       # e.g. "10:00"
    waste_item: str

class SuggestSlotsRequest(BaseModel):
    facility_name: str
    facility_address: str
    waste_item: str

class SlotSuggestion(BaseModel):
    date: str         # "2026-04-07"
    time: str         # "14:00"
    day_display: str  # "Mon, Apr 7"
    time_display: str # "2:00 PM"
    reason: str       # short rationale
    label: str = ""   # "Recommended" or ""

class SuggestSlotsResponse(BaseModel):
    suggestions: list[SlotSuggestion]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _build_credentials(db_user: User) -> Credentials:
    creds = Credentials(
        token=db_user.google_access_token,
        refresh_token=db_user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
    )
    return creds


def _refresh_if_needed(creds: Credentials, db_user: User, db: Session) -> Credentials:
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            db_user.google_access_token = creds.token
            db_user.google_token_expiry = creds.expiry
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="Google credential invalid or expired")
    return creds


def _get_user_with_tokens(user: dict, db: Session) -> User:
    db_user = db.query(User).filter(User.id == user["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not db_user.google_refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Google Calendar not connected. Please reconnect your Google account.",
        )
    return db_user


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/schedule/suggest", response_model=SuggestSlotsResponse)
async def suggest_schedule_slots(
    request: SuggestSlotsRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Agentic scheduling: fetch the user's Google Calendar for the next 7 days,
    pass existing events to Gemini, and return 5 conflict-aware time suggestions.
    """
    try:
        db_user = _get_user_with_tokens(user, db)
        creds = _refresh_if_needed(_build_credentials(db_user), db_user, db)

        # Fetch next 7 days of calendar events
        now = datetime.utcnow()
        week_later = now + timedelta(days=7)
        calendar_service = build("calendar", "v3", credentials=creds)
        events_result = calendar_service.events().list(
            calendarId="primary",
            timeMin=now.isoformat() + "Z",
            timeMax=week_later.isoformat() + "Z",
            singleEvents=True,
            orderBy="startTime",
        ).execute()

        existing_events = [
            {
                "title": e.get("summary", "Busy"),
                "start": e.get("start", {}).get("dateTime", e.get("start", {}).get("date", "")),
                "end":   e.get("end",   {}).get("dateTime", e.get("end",   {}).get("date", "")),
            }
            for e in events_result.get("items", [])
        ]

        logger.info(
            "Suggest slots — user=%s facility=%r item=%r existing_events=%d",
            user.get("sub"), request.facility_name, request.waste_item, len(existing_events),
        )

        # Ask Gemini for 5 smart suggestions
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
        )

        prompt = f"""You are a scheduling assistant helping someone drop off a waste item at a facility.

Today (UTC): {now.strftime("%Y-%m-%d %H:%M")}
Facility: {request.facility_name} — {request.facility_address}
Waste item: {request.waste_item}

User's existing calendar events for the next 7 days:
{json.dumps(existing_events, indent=2) if existing_events else "No events scheduled."}

Task: Suggest exactly 5 drop-off time slots across the next 7 days. Rules:
- Avoid times that overlap with existing events (add 30-min buffer)
- Prefer weekday mornings 9 AM–12 PM and early afternoons 1 PM–4 PM
- Include at least one weekend slot
- Spread suggestions across different days — no two on the same day
- Mark the single best option with label "Recommended", leave others as ""
- Keep each "reason" to 6 words or fewer

Respond with ONLY valid JSON — no markdown, no explanation:
{{
  "suggestions": [
    {{
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "day_display": "Mon, Apr 7",
      "time_display": "10:00 AM",
      "reason": "Free morning, no conflicts",
      "label": "Recommended"
    }}
  ]
}}"""

        response = await llm.ainvoke(prompt)
        raw = response.content.strip()

        # Strip markdown fences if Gemini wraps the JSON anyway
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw

        data = json.loads(raw)
        suggestions = [SlotSuggestion(**s) for s in data["suggestions"][:5]]
        return SuggestSlotsResponse(suggestions=suggestions)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("suggest_schedule_slots failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {e}")


@router.post("/schedule")
async def schedule_disposal(
    request: ScheduleRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a 1-hour Google Calendar event for a facility drop-off."""
    try:
        db_user = _get_user_with_tokens(user, db)
        creds = _refresh_if_needed(_build_credentials(db_user), db_user, db)

        try:
            start_dt = datetime.fromisoformat(f"{request.date}T{request.time}")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date or time format")

        end_dt = start_dt + timedelta(hours=1)

        event = {
            "summary": f"Dispose: {request.waste_item}",
            "location": request.facility_address,
            "description": f"Drop off {request.waste_item} at {request.facility_name}",
            "start": {"dateTime": start_dt.isoformat(), "timeZone": "America/New_York"},
            "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "America/New_York"},
        }

        calendar_service = build("calendar", "v3", credentials=creds)
        created = calendar_service.events().insert(calendarId="primary", body=event).execute()
        logger.info("Calendar event created: %s", created.get("id"))
        return {"status": "scheduled", "event": created}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("schedule_disposal failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scheduling failed: {e}")
