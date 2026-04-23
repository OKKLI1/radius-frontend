from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/hotspots",
    tags=["Hotspots"],
    dependencies=[Depends(verify_token)],
)


class HotspotCreate(BaseModel):
    name: str
    nas_id: Optional[int] = None
    location: Optional[str] = ""
    status: Optional[str] = "active"


class HotspotUpdate(BaseModel):
    name: Optional[str] = None
    nas_id: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None


def _ensure_table():
    execute(
        """
        CREATE TABLE IF NOT EXISTS axio_hotspots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            nas_id INT NULL,
            location VARCHAR(150) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


@router.get("", summary="List hotspots")
@router.get("/", include_in_schema=False)
def list_hotspots():
    _ensure_table()
    return query("SELECT id, name, nas_id, location, status FROM axio_hotspots ORDER BY id DESC")


@router.get("/{item_id}", summary="Get hotspot")
@router.get("/{item_id}/", include_in_schema=False)
def get_hotspot(item_id: int):
    _ensure_table()
    row = query(
        "SELECT id, name, nas_id, location, status FROM axio_hotspots WHERE id = %s",
        (item_id,),
        fetchone=True,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return row


@router.post("", status_code=201, summary="Create hotspot")
@router.post("/", status_code=201, include_in_schema=False)
def create_hotspot(data: HotspotCreate):
    _ensure_table()
    item_id = execute(
        """
        INSERT INTO axio_hotspots (name, nas_id, location, status)
        VALUES (%s, %s, %s, %s)
        """,
        (data.name, data.nas_id, data.location, data.status),
    )
    return {"ok": True, "id": item_id}


@router.put("/{item_id}", summary="Update hotspot")
@router.put("/{item_id}/", include_in_schema=False)
def update_hotspot(item_id: int, data: HotspotUpdate):
    _ensure_table()
    row = query("SELECT id FROM axio_hotspots WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True, "message": "Nothing to update"}
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [item_id]
    execute(f"UPDATE axio_hotspots SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "id": item_id}


@router.delete("/{item_id}", summary="Delete hotspot")
@router.delete("/{item_id}/", include_in_schema=False)
def delete_hotspot(item_id: int):
    _ensure_table()
    row = query("SELECT id FROM axio_hotspots WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    execute("DELETE FROM axio_hotspots WHERE id = %s", (item_id,))
    return {"ok": True, "deleted": item_id}
