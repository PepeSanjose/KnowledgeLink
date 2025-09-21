from typing import Optional

from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user_token, require_roles, pagination_params

router = APIRouter(tags=["teams"])


@router.get("")
def list_teams(
    project_id: Optional[int] = Query(default=None, description="Filtrar por proyecto"),
    _: tuple[int, int] = Depends(pagination_params),
    __: dict = Depends(get_current_user_token),
):
    """Stub: listado de equipos (vacío)."""
    return {"items": [], "total": 0, "project_id": project_id}


@router.post("", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def create_team(body: dict):
    """Stub: crear equipo (eco del body)."""
    return {"id": 1, **body}


@router.put("/{team_id}", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def update_team(team_id: int, body: dict):
    """Stub: actualizar equipo."""
    return {"id": team_id, **body}


@router.delete("/{team_id}", dependencies=[Depends(require_roles("ADMIN"))])
def delete_team(team_id: int):
    """Stub: borrar equipo."""
    return {"deleted": team_id}


@router.post("/{team_id}/users", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def assign_user_to_team(team_id: int, body: dict):
    """Stub: asignar usuario a equipo: body = {user_id: int}."""
    return {"team_id": team_id, "assigned_user": body.get("user_id")}


@router.post("/{team_id}/managers", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def assign_manager_to_team(team_id: int, body: dict):
    """Stub: asignar manager a equipo: body = {user_id: int}."""
    return {"team_id": team_id, "assigned_manager": body.get("user_id")}
