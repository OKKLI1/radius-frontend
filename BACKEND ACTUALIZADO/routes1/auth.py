from fastapi import APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
from core.config import settings
from core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", summary="Login del panel de administración")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Autentica al administrador del panel.
    Retorna un token JWT para usar en el resto de los endpoints.
    """
    if (
        form_data.username != settings.GUI_ADMIN_USER
        or form_data.password != settings.GUI_ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    token = create_access_token({"sub": form_data.username, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", summary="Info del usuario autenticado")
def me(payload: dict = Depends(__import__("core.security", fromlist=["verify_token"]).verify_token)):
    return {"username": payload.get("sub"), "role": payload.get("role")}
