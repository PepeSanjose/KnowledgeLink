from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.api_v1 import api_router
import logging
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.services.bootstrap import ensure_admin_user

settings = get_settings()
setup_logging(level=settings.LOG_LEVEL, structured=True)

app = FastAPI(title=settings.APP_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas v1
app.include_router(api_router)

# Startup hook: create tables and ensure admin user
@app.on_event("startup")
def on_startup() -> None:
    # Ensure models are imported before creating tables
    from app.models import User, Project, Team  # noqa: F401
    # Create tables (PoC/dev): for production prefer Alembic migrations
    Base.metadata.create_all(bind=engine)

    # Seed admin user (idempotent)
    settings = get_settings()
    logger = logging.getLogger("bootstrap")
    db = SessionLocal()
    try:
        ensure_admin_user(db, settings, logger)
    finally:
        db.close()

# Compatibilidad: endpoint raíz del Hola Mundo
@app.get("/")
def read_root():
    return {"message": "Hola mundo"}
