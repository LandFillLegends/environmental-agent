# Application configuration
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Landfill Legends"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:8081",
        "https://environmental-agent-seven.vercel.app",
        "https://environmental-agent-theta.vercel.app",
    ]

    # Auth
    BYPASS_AUTH: bool = False  # Set to True locally for testing without OAuth
    SUPABASE_JWT_SECRET: str

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None

    # Gemini
    GEMINI_API_KEY: Optional[str] = None

    # Tavily - Web Search
    TAVILY_API_KEY: Optional[str] = None

    # Google Places API
    GOOGLE_PLACES_API_KEY: Optional[str] = None

    # Supabase
    SUPABASE_URL: Optional[str] = None

    # Google OAuth
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = None
    GOOGLE_OAUTH_REDIRECT_URI: Optional[str] = None

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()