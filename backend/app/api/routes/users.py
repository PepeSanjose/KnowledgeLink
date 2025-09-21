from fastapi import APIRouter, Depends
from app.api.deps import get_current_user_token, require_roles

router = APIRouter(tags=["users"])


@router.get("")
def list_users(_: dict = Depends(require_roles("ADMIN", "MANAGEMENT"))):
    """
    Stub: devuelve lista vacía.
    Sustituir por integración real con repositorios/servicios.
    """
    return []


@router.get("/{user_id}")
def get_user(user_id: int, __: dict = Depends(get_current_user_token)):
    """
    Stub: devuelve usuario por id (falso).
    """
    return {"id": user_id, "email": "demo@example.com", "role": "ADMIN"}
