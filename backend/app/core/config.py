from functools import lru_cache
from typing import List, Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "km-mvp"
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "INFO"

    # Security / JWT
    JWT_SECRET: str = "changeme"  # cambia en .env para entornos reales
    JWT_ALG: str = "HS256"
    JWT_EXPIRES_MIN: int = 15
    REFRESH_EXPIRES_MIN: int = 43200  # 30 días

    # Database (PoC: SQLite; para Postgres usa postgresql+psycopg2://user:pass@host:5432/db)
    DATABASE_URL: str = "sqlite:///./app.db"

    # CORS
    # Puede ser lista en .env (CORS_ORIGINS='["http://localhost:5173"]') o CSV (CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> Any:
        if v is None or v == "":
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if isinstance(v, str):
            v = v.strip()
            # intenta JSON-list, si falla, tratar como CSV
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json

                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed]
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        if isinstance(v, (list, tuple)):
            return [str(x).strip() for x in v]
        return v

    # Admin bootstrap (startup seeding)
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None
    ADMIN_NAME: str = "Administrator"
    ADMIN_ROLE: str = "ADMIN"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
