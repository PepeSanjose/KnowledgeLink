from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.api_v1 import api_router

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

# Compatibilidad: endpoint raíz del Hola Mundo
@app.get("/")
def read_root():
    return {"message": "Hola mundo"}
