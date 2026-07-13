from pathlib import Path

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/widgets"
    AUTO_CREATE_SCHEMA: bool = False

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    DEEP_LINK_REDIRECT: str = "widgetapp://auth/callback"
    WEB_AUTH_REDIRECT_URI: str = "http://localhost:5173/auth/callback"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_MAX_TOKENS: int = 250
    AI_TEMPERATURE: float = 0.7
    AI_TIMEOUT_SECONDS: float = 30.0

    class Config:
        env_file = Path(__file__).with_name(".env")
        env_file_encoding = "utf-8"

settings = Settings()
