from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, pagination_params, require_roles
from app.models.transfer import Transfer
from app.models.user import User
from app.schemas.transfer import TransferCreate, TransferRead, TransferUpdate

router = APIRouter(tags=["transfers"])


@router.get("", response_model=dict[str, object], dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def list_transfers(
    page_size: tuple[int, int] = Depends(pagination_params),
    db: Session = Depends(get_db_dep),
):
    """Listado paginado de procesos de transferencia."""
    page, size = page_size

    total = db.execute(select(func.count()).select_from(Transfer)).scalar_one()
    items = (
        db.execute(select(Transfer).order_by(Transfer.created_at.desc()).offset((page - 1) * size).limit(size))
        .scalars()
        .all()
    )
    return {
        "items": [TransferRead.model_validate(t) for t in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post(
    "",
    response_model=TransferRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))],
)
def create_transfer(body: TransferCreate, db: Session = Depends(get_db_dep)) -> TransferRead:
    # Validar que la persona saliente exista y esté activa
    user = db.get(User, body.outgoing_user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La persona saliente no existe o está inactiva")

    t = Transfer(
        position=body.position,
        outgoing_user_id=body.outgoing_user_id,
        manager_instructions=body.manager_instructions,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return TransferRead.model_validate(t)


@router.get("/{transfer_id}", response_model=TransferRead, dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def get_transfer(transfer_id: int, db: Session = Depends(get_db_dep)) -> TransferRead:
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")
    return TransferRead.model_validate(t)


@router.put(
    "/{transfer_id}",
    response_model=TransferRead,
    dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))],
)
def update_transfer(transfer_id: int, body: TransferUpdate, db: Session = Depends(get_db_dep)) -> TransferRead:
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")

    if body.outgoing_user_id is not None and body.outgoing_user_id != t.outgoing_user_id:
        user = db.get(User, body.outgoing_user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La persona saliente no existe o está inactiva")
        t.outgoing_user_id = body.outgoing_user_id

    if body.position is not None:
        t.position = body.position
    if body.manager_instructions is not None:
        t.manager_instructions = body.manager_instructions

    db.add(t)
    db.commit()
    db.refresh(t)
    return TransferRead.model_validate(t)


@router.delete(
    "/{transfer_id}",
    response_model=dict[str, int],
    dependencies=[Depends(require_roles("ADMIN"))],
)
def delete_transfer(transfer_id: int, db: Session = Depends(get_db_dep)) -> dict[str, int]:
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")
    db.delete(t)
    db.commit()
    return {"deleted": transfer_id}
