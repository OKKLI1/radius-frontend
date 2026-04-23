from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from core.database import query, execute
from core.security import verify_token

router = APIRouter(prefix="/api/nas", tags=["Clientes NAS"], dependencies=[Depends(verify_token)])


class NASCreate(BaseModel):
    nasname: str          # IP o hostname del NAS
    shortname: str        # nombre corto / alias
    type: str = "other"   # cisco, mikrotik, other, etc.
    ports: Optional[int] = 1812
    secret: str           # shared secret
    description: Optional[str] = ""


class NASUpdate(BaseModel):
    shortname: Optional[str] = None
    type: Optional[str] = None
    ports: Optional[int] = None
    secret: Optional[str] = None
    description: Optional[str] = None


@router.get("", summary="x")
@router.get("/", include_in_schema=False, summary="Listar clientes NAS")
def list_nas():
    return query("SELECT id, nasname, shortname, type, ports, secret, description FROM nas ORDER BY shortname")


@router.get("/{nas_id}", summary="Detalle de un NAS")
def get_nas(nas_id: int):
    row = query("SELECT * FROM nas WHERE id = %s", (nas_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="NAS no encontrado")
    return row


@router.post("/", status_code=201, summary="Agregar cliente NAS")
def create_nas(data: NASCreate):
    existing = query("SELECT id FROM nas WHERE nasname = %s", (data.nasname,), fetchone=True)
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un NAS con esa IP/hostname")

    nas_id = execute(
        """INSERT INTO nas (nasname, shortname, type, ports, secret, description)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (data.nasname, data.shortname, data.type, data.ports, data.secret, data.description),
    )
    return {"ok": True, "id": nas_id, "nasname": data.nasname}


@router.put("/{nas_id}", summary="Actualizar cliente NAS")
def update_nas(nas_id: int, data: NASUpdate):
    row = query("SELECT * FROM nas WHERE id = %s", (nas_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="NAS no encontrado")

    # Construir UPDATE dinámico solo con campos enviados
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True, "message": "Nada que actualizar"}

    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [nas_id]
    execute(f"UPDATE nas SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "id": nas_id}


@router.delete("/{nas_id}", summary="Eliminar cliente NAS")
def delete_nas(nas_id: int):
    row = query("SELECT id FROM nas WHERE id = %s", (nas_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="NAS no encontrado")
    execute("DELETE FROM nas WHERE id = %s", (nas_id,))
    return {"ok": True, "deleted": nas_id}
