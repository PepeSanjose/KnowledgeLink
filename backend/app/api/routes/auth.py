from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    """
    Stub de login para PoC.
    - En producción: validar credenciales contra la base de datos, verificar hash,
      y establecer el rol real del usuario.
    """
    # Para PoC asumimos rol ADMIN. Sustituir por consulta real.
    token = create_access_token(subject=payload.email, role="ADMIN")
    return TokenResponse(access_token=token)
