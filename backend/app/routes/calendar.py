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