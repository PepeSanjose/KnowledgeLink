from typing import Optional

from fastapi import APIRouter, Depends, Query
from app.api.deps import pagination_params, require_roles

router = APIRouter(tags=["positions"])


@router.get("")
def list_positions(
    project_id: Optional[int] = Query(default=None, description="Filtrar por proyecto"),
    team_id: Optional[int] = Query(default=None, description="Filtrar por equipo"),
    _: tuple[int, int] = Depends(pagination_params),
):
    """Stub: listado de puestos (vacío)."""
    return {"items": [], "total": 0, "project_id": project_id, "team_id": team_id}


@router.post("", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def create_position(body: dict):
    """Stub: crear puesto (eco del body)."""
    return {"id": 1, **body}


@router.put("/{position_id}", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def update_position(position_id: int, body: dict):
    """Stub: actualizar puesto."""
    return {"id": position_id, **body}


@router.delete("/{position_id}", dependencies=[Depends(require_roles("ADMIN"))])
def delete_position(position_id: int):
    """Stub: borrar puesto."""
    return {"deleted": position_id}
