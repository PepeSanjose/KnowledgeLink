from fastapi import APIRouter

# Los siguientes módulos serán añadidos como stubs:
from app.api.routes import users, projects, teams, positions, auth, transfers  # type: ignore[unused-import]

api_router = APIRouter(prefix="/api/v1")

# Healthcheck (público)
@api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}

# Rutas
# Se incluirán con prefijos específicos
try:
    api_router.include_router(users.router, prefix="/users", tags=["users"])       # type: ignore[attr-defined]
    api_router.include_router(projects.router, prefix="/projects", tags=["projects"])  # type: ignore[attr-defined]
    api_router.include_router(teams.router, prefix="/teams", tags=["teams"])       # type: ignore[attr-defined]
    api_router.include_router(positions.router, prefix="/positions", tags=["positions"])  # type: ignore[attr-defined]
    api_router.include_router(auth.router)  # type: ignore[attr-defined]
    api_router.include_router(transfers.router, prefix="/transfers", tags=["transfers"])  # type: ignore[attr-defined]
except Exception:
    # Durante el bootstrap inicial puede no existir alguno; no romper la importación
    pass
