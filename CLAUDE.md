# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landfill Legends is an AI-powered waste classification app. Users photograph or describe waste items, and a LangGraph agent pipeline classifies them and returns disposal instructions. The backend uses Google Gemini (gemini-2.5-flash) via `langchain-google-genai` for vision/text AI with Tavily web search for local disposal regulations. Auth is handled by Supabase.

## Repository Structure

- **`backend/`** — FastAPI (Python 3.11) server with LangGraph agent orchestration
- **`frontend/`** — Expo/React Native app (TypeScript) targeting iOS, Android, and Web

## Common Commands

### Backend

```bash
# Setup
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Run dev server (from backend/)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python main.py

# API docs available at http://localhost:8000/docs

# Database migrations (from backend/)
alembic upgrade head                              # Apply all migrations
alembic revision --autogenerate -m "description"  # Generate migration
alembic downgrade -1                              # Rollback last migration
```

### Frontend

```bash
# Setup
cd frontend && npm install

# Run
npm start          # Expo dev server
npm run web        # Web only
npm run ios        # iOS only
npm run android    # Android only

# Lint
npm run lint

# Build for web deployment
npm run build
```

### Testing

No automated tests exist yet. No test framework is configured for either backend or frontend.

## Architecture

### Classification Pipeline (LangGraph)

The core AI workflow is in `backend/app/services/agent.py` as a LangGraph `StateGraph`:

```
START → router_node (conditional)
  ├─ image_classification_node ─┐
  └─ text_classification_node  ─┤
                                ↓
                    disposal_agent_node ←──┐
                          ↓                │
                    tools_condition         │
                      ├─ "tools" → ToolNode┘  (loop: search again)
                      └─ END                   (done: return results)
```

- **Router** decides image vs text path based on whether `image_base64` is present
- **Classification nodes** call Gemini via `gemini_service.py` to identify waste items, returning structured JSON (item_name, material_type, is_hazardous, is_soiled, confidence_score, search_query)
- **Disposal agent node** runs an agentic loop: `ChatGoogleGenerativeAI` with `bind_tools([TavilySearch])` iterates autonomously — Gemini decides when to search, analyzes results, may search again with refined queries, and terminates by returning structured JSON without tool calls
- State uses separate `InputState`, `OutputState`, and `OverallState` TypedDicts. The `messages` field in `OverallState` uses LangGraph's `add_messages` reducer to accumulate conversation history across loop iterations

### Backend Key Files

- `backend/main.py` — FastAPI app, CORS config (currently allows all origins `"*"`), router registration
- `backend/app/core/config.py` — Settings via pydantic-settings (reads `.env`)
- `backend/app/core/auth.py` — Google token verification dependency; `BYPASS_AUTH=True` skips auth in dev
- `backend/app/routes/classification.py` — `POST /api/v1/classify` endpoint
- `backend/app/services/agent.py` — LangGraph state machine with agentic disposal loop
- `backend/app/services/gemini_service.py` — Gemini API calls (`classify_image`, `classify_text`, `parse_json_response` for stripping markdown fences)
- `backend/app/services/location_service.py` — IP geolocation via ipinfo.io (falls back to "Marietta, GA 30062, US" for private IPs)
- `backend/app/schemas/classification.py` — Pydantic request/response models for classification

### Primary API Endpoint

`POST /api/v1/classify` — Accepts `{ image_base64?, message?, location? }`, returns `{ items, disposal_instructions, total_items, processing_time_ms }`.

### Frontend Flow

1. Home screen (`app/(tabs)/index.tsx`) offers two paths: camera capture (base64 image) or text description
2. Both navigate to shared `/loading` screen with params
3. Loading screen calls `classifyWasteInput()` from `services/api.ts`
4. On success, navigates back to home with `classificationResult` param
5. Home screen opens `ClassificationResultsSheet` bottom sheet with results

### Type Sync

Backend Pydantic schemas (`backend/app/schemas/`) and frontend TypeScript types (`frontend/types/`) must be kept in sync manually. There is no codegen.

## Conventions

- **Frontend file names**: kebab-case (e.g., `classification-results-sheet.tsx`)
- **Frontend imports**: Use `@/` path alias (e.g., `import { ThemedText } from '@/components/themed-text'`)
- **Backend imports**: Absolute from `app.*` (e.g., `from app.core.config import settings`)
- **Database**: SQLAlchemy User model exists with Alembic migrations, but classification results are not persisted to DB yet
- **Frontend API base URL**: Hardcoded local dev IP in `frontend/services/api.ts` — must match your machine's IP for device testing

## Environment Variables

### Backend (`backend/.env`)

- `GEMINI_API_KEY` — Required for Gemini AI classification
- `TAVILY_API_KEY` — Required for web search in disposal agent
- `DATABASE_URL` — PostgreSQL connection string (Supabase)
- `BYPASS_AUTH` — Default `True` for dev (skips auth)
- `GOOGLE_OAUTH_CLIENT_ID` — For Google token verification in production
- `OPENAI_API_KEY` — Optional, for LangGraph/LangChain tracing

### Frontend

- `EXPO_PUBLIC_API_URL` — Backend API base URL
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

## Deployment

- **Frontend**: Vercel (static export via `expo export`). Production URL: `https://environmental-agent-seven.vercel.app`
- **Backend**: Render. Production URL: `https://environmental-agent.onrender.com`
