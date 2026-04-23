from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from core.config import settings
from core.security import create_access_token, verify_token

router = APIRouter(prefix="/api/auth", tags=["Autenticacion"])


@router.post("/login", summary="Login del panel de administracion")
@router.post("/login/", include_in_schema=False)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if (
        form_data.username != settings.GUI_ADMIN_USER
        or form_data.password != settings.GUI_ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contrasena incorrectos",
        )

    token = create_access_token({"sub": form_data.username, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", summary="Info del usuario autenticado")
@router.get("/me/", include_in_schema=False)
def me(payload: dict = Depends(verify_token)):
    return {"username": payload.get("sub"), "role": payload.get("role")}
