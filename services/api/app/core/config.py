import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[4]
IS_VERCEL = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.getenv("VERCEL_URL"))
DEFAULT_DATABASE_PATH = Path("/tmp/sawasdee-transit/app.db") if IS_VERCEL else PROJECT_ROOT / "data/app.db"
DEFAULT_UPLOAD_DIR = Path("/tmp/sawasdee-transit/uploads") if IS_VERCEL else PROJECT_ROOT / "data/uploads"


class Settings(BaseSettings):
    app_name: str = "Thailand Tourism Transit MVP"
    database_url: str | None = None
    database_path: Path = DEFAULT_DATABASE_PATH
    upload_dir: Path = DEFAULT_UPLOAD_DIR
    public_base_url: str = "http://127.0.0.1:8000"
    tat_api_key: str | None = None
    tat_api_base_url: str = "https://tatdataapi.io/api/v2"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    google_api_key: str | None = None
    maptiler_key: str | None = None
    mapbox_token: str | None = None
    longdo_api_key: str | None = None
    google_maps_api_key: str | None = None
    google_places_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_prefix="TTM_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if IS_VERCEL:
        # Vercel deployments are read-only except for /tmp. Environment variables
        # copied from local development may still point at data/*, so normalize
        # runtime-only paths at startup before FastAPI creates upload folders.
        settings.database_path = Path("/tmp/sawasdee-transit/app.db")
        settings.upload_dir = Path("/tmp/sawasdee-transit/uploads")
    return settings
