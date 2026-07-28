from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HackForge"
    app_version: str = "0.1.0"
    debug: bool = False

    secret_key: str
    database_url: str
    google_client_id: str = ""

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    allowed_origins: str = "http://127.0.0.1:5174,http://localhost:5174,http://127.0.0.1:4175,http://localhost:4175"
    frontend_url: str = "http://127.0.0.1:5174"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    ai_groq_api_key: str = ""
    ai_groq_model: str = "llama-3.3-70b-versatile"
    ai_gemini_api_key: str = ""
    ai_gemini_model: str = "gemini-flash-latest"
    ai_request_timeout_seconds: float = 45
    ai_requests_per_minute: int = 10
    ai_max_tokens: int = 800

    @field_validator("database_url", mode="before")
    @classmethod
    def use_async_postgres_driver(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("debug", mode="before")
    @classmethod
    def normalize_debug(cls, value):
        if isinstance(value, str) and value.lower() in {"release", "production", "prod"}:
            return False
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings():
    return Settings()
