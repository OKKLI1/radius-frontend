from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/ip-pool",
    tags=["IP Pool"],
    dependencies=[Depends(verify_token)],
)


class IPPoolCreate(BaseModel):
    name: str
    start_ip: str
    end_ip: str
    nas_id: Optional[int] = None


class IPPoolUpdate(BaseModel):
    name: Optional[str] = None
    start_ip: Optional[str] = None
    end_ip: Optional[str] = None
    nas_id: Optional[int] = None


def _ensure_table():
    execute(
        """
        CREATE TABLE IF NOT EXISTS axio_ip_pool (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            start_ip VARCHAR(45) NOT NULL,
            end_ip VARCHAR(45) NOT NULL,
            nas_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


@router.get("", summary="List IP pools")
@router.get("/", include_in_schema=False)
def list_ip_pool():
    _ensure_table()
    return query(
        "SELECT id, name, start_ip, end_ip, nas_id FROM axio_ip_pool ORDER BY id DESC"
    )


@router.get("/{item_id}", summary="Get IP pool")
@router.get("/{item_id}/", include_in_schema=False)
def get_ip_pool(item_id: int):
    _ensure_table()
    row = query(
        "SELECT id, name, start_ip, end_ip, nas_id FROM axio_ip_pool WHERE id = %s",
        (item_id,),
        fetchone=True,
    )
    if not row:
        raise HTTPException(status_code=404, detail="IP pool not found")
    return row


@router.post("", status_code=201, summary="Create IP pool")
@router.post("/", status_code=201, include_in_schema=False)
def create_ip_pool(data: IPPoolCreate):
    _ensure_table()
    item_id = execute(
        """
        INSERT INTO axio_ip_pool (name, start_ip, end_ip, nas_id)
        VALUES (%s, %s, %s, %s)
        """,
        (data.name, data.start_ip, data.end_ip, data.nas_id),
    )
    return {"ok": True, "id": item_id}


@router.put("/{item_id}", summary="Update IP pool")
@router.put("/{item_id}/", include_in_schema=False)
def update_ip_pool(item_id: int, data: IPPoolUpdate):
    _ensure_table()
    row = query("SELECT id FROM axio_ip_pool WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="IP pool not found")
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True, "message": "Nothing to update"}
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [item_id]
    execute(f"UPDATE axio_ip_pool SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "id": item_id}


@router.delete("/{item_id}", summary="Delete IP pool")
@router.delete("/{item_id}/", include_in_schema=False)
def delete_ip_pool(item_id: int):
    _ensure_table()
    row = query("SELECT id FROM axio_ip_pool WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="IP pool not found")
    execute("DELETE FROM axio_ip_pool WHERE id = %s", (item_id,))
    return {"ok": True, "deleted": item_id}
