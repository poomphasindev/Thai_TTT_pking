from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.db import init_db
from app.routers import auth, copilot, health, places, reports, tickets, trips, wallet


def create_app() -> FastAPI:
    settings = get_settings()
    init_db()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        return response

    app.include_router(health.router, prefix="/api", tags=["health"])
    app.include_router(auth.router, prefix="/api", tags=["auth"])
    app.include_router(copilot.router, prefix="/api", tags=["copilot"])
    app.include_router(places.router, prefix="/api", tags=["places"])
    app.include_router(reports.router, prefix="/api", tags=["reports"])
    app.include_router(tickets.router, prefix="/api", tags=["tickets"])
    app.include_router(trips.router, prefix="/api", tags=["trips"])
    app.include_router(wallet.router, prefix="/api", tags=["wallet"])

    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    public_dir = Path(__file__).resolve().parents[2] / "web"
    if public_dir.exists():
        app.mount("/", StaticFiles(directory=public_dir, html=True), name="web")

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
