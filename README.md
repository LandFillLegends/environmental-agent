# Backend Setup

FastAPI backend with LangGraph integration for Landfill Legends.

## Setup Instructions

### 1. Create and activate virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# OR on Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 4. Run the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- Main API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Chat endpoint: http://localhost:8000/chat

## API Endpoints

- `GET /` - Health check
- `GET /chat` - Chat with LangGraph agent

## Tech Stack

- FastAPI - Web framework
- LangGraph - AI agent orchestration
- LangChain - LLM integration
- Uvicorn - ASGI server

