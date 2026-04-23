from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/hunt-groups",
    tags=["Hunt Groups"],
    dependencies=[Depends(verify_token)],
)


class HuntGroupCreate(BaseModel):
    name: str
    attribute: str
    op: str = "=="
    value: str


class HuntGroupUpdate(BaseModel):
    name: Optional[str] = None
    attribute: Optional[str] = None
    op: Optional[str] = None
    value: Optional[str] = None


def _ensure_table():
    execute(
        """
        CREATE TABLE IF NOT EXISTS axio_hunt_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            attribute VARCHAR(100) NOT NULL,
            op VARCHAR(8) NOT NULL DEFAULT '==',
            value VARCHAR(200) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


@router.get("", summary="List hunt groups")
@router.get("/", include_in_schema=False)
def list_hunt_groups():
    _ensure_table()
    return query(
        "SELECT id, name, attribute, op, value FROM axio_hunt_groups ORDER BY id DESC"
    )


@router.get("/{item_id}", summary="Get hunt group")
@router.get("/{item_id}/", include_in_schema=False)
def get_hunt_group(item_id: int):
    _ensure_table()
    row = query(
        "SELECT id, name, attribute, op, value FROM axio_hunt_groups WHERE id = %s",
        (item_id,),
        fetchone=True,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Hunt group not found")
    return row


@router.post("", status_code=201, summary="Create hunt group")
@router.post("/", status_code=201, include_in_schema=False)
def create_hunt_group(data: HuntGroupCreate):
    _ensure_table()
    item_id = execute(
        """
        INSERT INTO axio_hunt_groups (name, attribute, op, value)
        VALUES (%s, %s, %s, %s)
        """,
        (data.name, data.attribute, data.op, data.value),
    )
    return {"ok": True, "id": item_id}


@router.put("/{item_id}", summary="Update hunt group")
@router.put("/{item_id}/", include_in_schema=False)
def update_hunt_group(item_id: int, data: HuntGroupUpdate):
    _ensure_table()
    row = query("SELECT id FROM axio_hunt_groups WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Hunt group not found")
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True, "message": "Nothing to update"}
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [item_id]
    execute(f"UPDATE axio_hunt_groups SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "id": item_id}


@router.delete("/{item_id}", summary="Delete hunt group")
@router.delete("/{item_id}/", include_in_schema=False)
def delete_hunt_group(item_id: int):
    _ensure_table()
    row = query("SELECT id FROM axio_hunt_groups WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Hunt group not found")
    execute("DELETE FROM axio_hunt_groups WHERE id = %s", (item_id,))
    return {"ok": True, "deleted": item_id}
