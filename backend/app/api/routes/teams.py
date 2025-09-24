from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, insert
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, pagination_params, require_roles
from app.models.project import Project
from app.models.team import Team
from app.models.user import User
from app.models.associations import team_managers
from app.schemas.team import TeamCreate, TeamRead, TeamUpdate

router = APIRouter(tags=["teams"])


@router.get("", response_model=dict[str, object])
def list_teams(
    project_id: Optional[int] = Query(default=None, description="Filtrar por proyecto"),
    page_size: tuple[int, int] = Depends(pagination_params),
    db: Session = Depends(get_db_dep),
):
    """Listado de equipos con filtro opcional por proyecto."""
    page, size = page_size

    base_q = select(Team)
    count_q = select(func.count()).select_from(Team)

    if project_id is not None:
        base_q = base_q.where(Team.project_id == project_id)
        count_q = count_q.where(Team.project_id == project_id)

    total = db.execute(count_q).scalar_one()
    items = db.execute(base_q.offset((page - 1) * size).limit(size)).scalars().all()

    return {
        "items": [TeamRead.model_validate(t) for t in items],
        "total": total,
        "page": page,
        "size": size,
        "project_id": project_id,
    }


@router.post(
    "",
    response_model=TeamRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))],
)
def create_team(body: TeamCreate, db: Session = Depends(get_db_dep)) -> TeamRead:
    # Verificar proyecto existente
    proj = db.get(Project, body.project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Proyecto no existe")

    # Validar managers_ids (≥1) y existencia/rol
    ids = list(dict.fromkeys(body.managers_ids or []))  # únicos preservando orden
    if not ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debes asignar al menos un manager")

    users = db.execute(
        select(User).where(User.id.in_(ids), User.is_active == True)  # noqa: E712
    ).scalars().all()
    if len(users) != len(ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Algún manager no existe o está inactivo")

    # Solo roles MANAGEMENT o ADMIN; y al menos uno MANAGEMENT
    roles_ok = all(u.role in {"MANAGEMENT", "ADMIN"} for u in users)
    has_management = any(u.role == "MANAGEMENT" for u in users)
    if not roles_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden asignar usuarios con rol MANAGEMENT o ADMIN como managers",
        )
    if not has_management:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El equipo debe tener al menos un usuario con rol MANAGEMENT como manager",
        )

    # Unicidad por (project_id, name)
    existing = db.execute(
        select(Team).where(Team.project_id == body.project_id, Team.name == body.name)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un equipo con ese nombre en el proyecto")

    team = Team(
        name=body.name,
        description=body.description,
        project_id=body.project_id,
        is_active=body.is_active,
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Asignar managers
    db.execute(
        insert(team_managers),
        [{"team_id": team.id, "user_id": u.id} for u in users],
    )
    db.commit()
    db.refresh(team)

    return TeamRead.model_validate(team)


@router.get("/{team_id}", response_model=TeamRead)
def get_team(team_id: int, db: Session = Depends(get_db_dep)) -> TeamRead:
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado")
    return TeamRead.model_validate(team)


@router.put(
    "/{team_id}",
    response_model=TeamRead,
    dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))],
)
def update_team(team_id: int, body: TeamUpdate, db: Session = Depends(get_db_dep)) -> TeamRead:
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado")

    # Si cambia el project_id, verificar su existencia
    if body.project_id is not None and body.project_id != team.project_id:
        proj = db.get(Project, body.project_id)
        if not proj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Proyecto no existe")
        team.project_id = body.project_id

    # Unicidad por (project_id, name) si cambia el nombre o el proyecto
    new_name = body.name if body.name is not None else team.name
    new_project_id = body.project_id if body.project_id is not None else team.project_id
    if new_name != team.name or new_project_id != team.project_id:
        existing = db.execute(
            select(Team).where(Team.project_id == new_project_id, Team.name == new_name, Team.id != team.id)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un equipo con ese nombre en el proyecto")
        team.name = new_name
        team.project_id = new_project_id

    if body.description is not None:
        team.description = body.description
    if body.is_active is not None:
        team.is_active = body.is_active

    db.add(team)
    db.commit()
    db.refresh(team)
    return TeamRead.model_validate(team)


@router.delete(
    "/{team_id}",
    response_model=dict[str, int],
    dependencies=[Depends(require_roles("ADMIN"))],
)
def delete_team(team_id: int, db: Session = Depends(get_db_dep)) -> dict[str, int]:
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado")
    db.delete(team)
    db.commit()
    return {"deleted": team_id}
