# Backend Setup and Usage

## Project Structure

```
backend/
├── app/              # FastAPI application structure
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── schemas/      # Pydantic schemas
│   ├── services/     # Business logic (LangGraph agents, etc.)
│   ├── core/         # Core configuration
│   └── database.py   # Database connection
├── alembic/          # Database migrations
├── main.py           # Application entry point
├── requirements.txt  # Python dependencies
├── venv/             # Virtual environment (not tracked in git)
└── .env              # Environment variables (not tracked in git)
```

## Setup

1. **Activate the virtual environment:**

   ```bash
   cd backend
   source venv/bin/activate
   ```

2. **Install dependencies (if not already installed):**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Running the Server

### Option 1: Using Python directly

```bash
python main.py
```

### Option 2: Using the start script

```bash
./start.sh
```

### Option 3: Using uvicorn with auto-reload

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at: **http://localhost:8000**

## API Documentation

Once the server is running, you can access:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Available Endpoints

- `GET /` - Health check
- `GET /chat` - Chat with the LangGraph agent

## Database Migrations

Run migrations:

```bash
alembic upgrade head
```

Create a new migration:

```bash
alembic revision --autogenerate -m "description"
```
