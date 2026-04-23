from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/user-groups",
    tags=["User Groups"],
    dependencies=[Depends(verify_token)],
)


class UserGroupCreate(BaseModel):
    username: str
    groupname: str
    priority: int = 1


class UserGroupUpdate(BaseModel):
    username: Optional[str] = None
    groupname: Optional[str] = None
    priority: Optional[int] = None


@router.get("", summary="List user-group mappings")
@router.get("/", include_in_schema=False)
def list_user_groups():
    return query(
        """
        SELECT id, username, groupname, priority
        FROM radusergroup
        ORDER BY username, priority, id
        """
    )


@router.get("/{item_id}", summary="Get user-group mapping")
@router.get("/{item_id}/", include_in_schema=False)
def get_user_group(item_id: int):
    row = query(
        "SELECT id, username, groupname, priority FROM radusergroup WHERE id = %s",
        (item_id,),
        fetchone=True,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return row


@router.post("", status_code=201, summary="Create user-group mapping")
@router.post("/", status_code=201, include_in_schema=False)
def create_user_group(data: UserGroupCreate):
    item_id = execute(
        """
        INSERT INTO radusergroup (username, groupname, priority)
        VALUES (%s, %s, %s)
        """,
        (data.username, data.groupname, data.priority),
    )
    return {"ok": True, "id": item_id}


@router.put("/{item_id}", summary="Update user-group mapping")
@router.put("/{item_id}/", include_in_schema=False)
def update_user_group(item_id: int, data: UserGroupUpdate):
    row = query("SELECT id FROM radusergroup WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Mapping not found")

    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        return {"ok": True, "message": "Nothing to update"}

    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [item_id]
    execute(f"UPDATE radusergroup SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "id": item_id}


@router.delete("/{item_id}", summary="Delete user-group mapping")
@router.delete("/{item_id}/", include_in_schema=False)
def delete_user_group(item_id: int):
    row = query("SELECT id FROM radusergroup WHERE id = %s", (item_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Mapping not found")
    execute("DELETE FROM radusergroup WHERE id = %s", (item_id,))
    return {"ok": True, "deleted": item_id}
