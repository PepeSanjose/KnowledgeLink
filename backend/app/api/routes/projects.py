from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, pagination_params, require_roles
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(tags=["projects"])


@router.get("", response_model=dict[str, object])
def list_projects(
    page_size: tuple[int, int] = Depends(pagination_params),
    db: Session = Depends(get_db_dep),
):
    page, size = page_size
    total = db.execute(select(func.count()).select_from(Project)).scalar_one()
    items = (
        db.execute(select(Project).offset((page - 1) * size).limit(size))
        .scalars()
        .all()
    )
    return {
        "items": [ProjectRead.model_validate(p) for p in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))],
)
def create_project(body: ProjectCreate, db: Session = Depends(get_db_dep)) -> ProjectRead:
    existing = db.execute(select(Project).where(Project.name == body.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de proyecto ya existe")
    proj = Project(name=body.name, description=body.description, is_active=body.is_active)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return ProjectRead.model_validate(proj)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db_dep)) -> ProjectRead:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return ProjectRead.model_validate(proj)


@router.put(
    "/{project_id}",
    response_model=ProjectRead,
    dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))],
)
def update_project(project_id: int, body: ProjectUpdate, db: Session = Depends(get_db_dep)) -> ProjectRead:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")

    # Unicidad por nombre si cambia
    if body.name and body.name != proj.name:
        existing = db.execute(select(Project).where(Project.name == body.name)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de proyecto ya existe")
        proj.name = body.name

    if body.description is not None:
        proj.description = body.description
    if body.is_active is not None:
        proj.is_active = body.is_active

    db.add(proj)
    db.commit()
    db.refresh(proj)
    return ProjectRead.model_validate(proj)


@router.delete(
    "/{project_id}",
    response_model=dict[str, int],
    dependencies=[Depends(require_roles("ADMIN"))],
)
def delete_project(project_id: int, db: Session = Depends(get_db_dep)) -> dict[str, int]:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    db.delete(proj)
    db.commit()
    return {"deleted": project_id}
