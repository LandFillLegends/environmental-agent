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

    BYPASS_AUTH: bool = False

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None

    # Gemini
    GEMINI_API_KEY: Optional[str] = None

    # Google OAuth (your friend is building this on another branch)
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    BYPASS_AUTH: bool = True  # Set to False in production once OAuth is ready

    # Environment
    ENVIRONMENT: str = "development"

    SUPABASE_JWT_SECRET: str

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
