from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/realm-proxy",
    tags=["Realm Proxy"],
    dependencies=[Depends(verify_token)],
)


class RealmProxyCreate(BaseModel):
    realm: str
    server: str
    port: int = 1812
    secret: str


class RealmProxyUpdate(BaseModel):
    realm: Optional[str] = None
    server: Optional[str] = None
    port: Optional[int] = None
    secret: Optional[str] = None


def _ensure_table():
    execute(
        """
        CREATE TABLE IF NOT EXISTS axio_realm_proxy (
            id INT AUTO_INCREMENT PRIMARY KEY,
            realm VARCHAR(120) NOT NULL,
            server VARCHAR(120) NOT NULL,
            port INT NOT NULL DEFAULT 1812,
            secret VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


@router.get("", summary="List realm proxy rules")
@router.get("/", include_in_schema=False)
def list_realm_proxy():
    _ensure_table()
    return query(
        "SELECT id, realm, server, port, secret FROM axio_realm_proxy ORDER BY id DESC"
    )


@router.get("/{item_id}", summary="Get realm proxy rule")
@router.get("/{item_id}/", include_in_schema=False)
def get_realm_proxy(item_id: int):
    _ensure_table()
    row = query(
        "SELECT id, realm, server, port, secret FROM axio_realm_proxy WHERE id = %s",
        (item_id,),
        fetchone=True,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Realm proxy rule not found")
    return row


@router.post("", status_code=201, summary="Create realm proxy rule")
@router.post("/", status_code=201, include_in_schema=False)
def create_realm_proxy(data: RealmProxyCreate):
    _ensure_table()
    item_id = execute(
        """
        INSERT INTO axio_realm_proxy (realm, server, port, secret)
        VALUES (%s, %s, %s, %s)
        """,
        (data.realm, data.server, data.port, data.secret),
    )
    return {"ok": True, "id": item_id}


@router.put("/{item_id}", summary="Update realm proxy rule")
@router.put("/{item_id}/", include_in_schema=False)
def update_realm_proxy(item_id: int, data: RealmProxyUpdate):
    _ensure_table()
    row = query("SELECT id FROM axio_realm_proxy WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Realm proxy rule not found")
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True, "message": "Nothing to update"}
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [item_id]
    execute(f"UPDATE axio_realm_proxy SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "id": item_id}


@router.delete("/{item_id}", summary="Delete realm proxy rule")
@router.delete("/{item_id}/", include_in_schema=False)
def delete_realm_proxy(item_id: int):
    _ensure_table()
    row = query("SELECT id FROM axio_realm_proxy WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Realm proxy rule not found")
    execute("DELETE FROM axio_realm_proxy WHERE id = %s", (item_id,))
    return {"ok": True, "deleted": item_id}
