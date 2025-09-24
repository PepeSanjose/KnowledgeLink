from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, pagination_params, require_roles
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserLogin

router = APIRouter(tags=["users"])


@router.get("", response_model=dict[str, object], dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def list_users(
    db: Session = Depends(get_db_dep),
    page_size: tuple[int, int] = Depends(pagination_params),
):
    page, size = page_size
    total = db.execute(select(func.count()).select_from(User)).scalar_one()
    items = (
        db.execute(select(User).offset((page - 1) * size).limit(size))
        .scalars()
        .all()
    )
    return {
        "items": [UserRead.model_validate(u) for u in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("ADMIN"))])
def create_user(body: UserCreate, db: Session = Depends(get_db_dep)) -> UserRead:
    existing = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email ya registrado")
    user = User(
        email=body.email,
        hashed_password=get_password_hash(body.password),
        full_name=body.full_name,
        role=body.role or "USER",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
def get_user(user_id: int, db: Session = Depends(get_db_dep)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return UserRead.model_validate(user)


@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(require_roles("ADMIN"))])
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db_dep)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.password:
        user.hashed_password = get_password_hash(body.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", response_model=dict[str, int], dependencies=[Depends(require_roles("ADMIN"))])
def delete_user(user_id: int, db: Session = Depends(get_db_dep)) -> dict[str, int]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"deleted": user_id}


# Endpoint de login simple para PoC (sin JWT): valida usuario/contraseña y devuelve datos básicos
@router.post("/login", response_model=dict[str, object])
def login_simple(body: UserLogin, db: Session = Depends(get_db_dep)) -> dict[str, object]:
    user = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if not user or not user.is_active or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "is_active": user.is_active,
    }
