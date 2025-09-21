from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user_token, require_roles, pagination_params

router = APIRouter(tags=["projects"])


@router.get("")
def list_projects(
    _: tuple[int, int] = Depends(pagination_params),
    __: dict = Depends(get_current_user_token),
):
    """Stub: listado de proyectos (vacío)."""
    return {"items": [], "total": 0}


@router.post("", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def create_project(body: dict):
    """Stub: crear proyecto (eco del body)."""
    return {"id": 1, **body}


@router.get("/{project_id}")
def get_project(project_id: int, __: dict = Depends(get_current_user_token)):
    """Stub: obtener proyecto por id."""
    return {"id": project_id, "nombre": "Demo"}


@router.put("/{project_id}", dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def update_project(project_id: int, body: dict):
    """Stub: actualizar proyecto."""
    return {"id": project_id, **body}


@router.delete("/{project_id}", dependencies=[Depends(require_roles("ADMIN"))])
def delete_project(project_id: int):
    """Stub: borrar proyecto."""
    return {"deleted": project_id}
