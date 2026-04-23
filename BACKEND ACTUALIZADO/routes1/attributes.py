from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/attributes",
    tags=["Attributes"],
    dependencies=[Depends(verify_token)],
)


class AttributeCreate(BaseModel):
    scope: str  # user | group
    target: str
    attribute: str
    op: str = ":="
    value: str
    bucket: Optional[str] = None  # check | reply (optional)


class AttributeUpdate(BaseModel):
    scope: Optional[str] = None
    target: Optional[str] = None
    attribute: Optional[str] = None
    op: Optional[str] = None
    value: Optional[str] = None


TABLE_MAP = {
    ("user", "check"): ("radcheck", "username"),
    ("user", "reply"): ("radreply", "username"),
    ("group", "check"): ("radgroupcheck", "groupname"),
    ("group", "reply"): ("radgroupreply", "groupname"),
}


def _normalize_scope(scope: str) -> str:
    scope = (scope or "").strip().lower()
    if scope not in ("user", "group"):
        raise HTTPException(status_code=400, detail="scope must be 'user' or 'group'")
    return scope


def _normalize_bucket(scope: str, bucket: Optional[str]) -> str:
    if bucket is None:
        return "check"
    bucket = bucket.strip().lower()
    if bucket not in ("check", "reply"):
        raise HTTPException(status_code=400, detail="bucket must be 'check' or 'reply'")
    return bucket


def _parse_uid(uid: str):
    # uid format: scope:bucket:id  e.g. user:check:14
    parts = uid.split(":")
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid uid format")
    scope, bucket, raw_id = parts
    scope = _normalize_scope(scope)
    bucket = _normalize_bucket(scope, bucket)
    try:
        row_id = int(raw_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid uid id")
    table, target_col = TABLE_MAP[(scope, bucket)]
    return scope, bucket, table, target_col, row_id


@router.get("", summary="List attributes")
@router.get("/", include_in_schema=False)
def list_attributes():
    rows = query(
        """
        SELECT id, 'user' AS scope, 'check' AS bucket, username AS target, attribute, op, value
        FROM radcheck
        UNION ALL
        SELECT id, 'user' AS scope, 'reply' AS bucket, username AS target, attribute, op, value
        FROM radreply
        UNION ALL
        SELECT id, 'group' AS scope, 'check' AS bucket, groupname AS target, attribute, op, value
        FROM radgroupcheck
        UNION ALL
        SELECT id, 'group' AS scope, 'reply' AS bucket, groupname AS target, attribute, op, value
        FROM radgroupreply
        ORDER BY scope, target, attribute
        """
    )

    for r in rows:
        r["uid"] = f"{r['scope']}:{r['bucket']}:{r['id']}"
    return rows


@router.get("/{uid}", summary="Get attribute by uid")
@router.get("/{uid}/", include_in_schema=False)
def get_attribute(uid: str):
    scope, bucket, table, target_col, row_id = _parse_uid(uid)
    row = query(
        f"SELECT id, {target_col} AS target, attribute, op, value FROM {table} WHERE id = %s",
        (row_id,),
        fetchone=True,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Attribute not found")
    row["scope"] = scope
    row["bucket"] = bucket
    row["uid"] = uid
    return row


@router.post("", status_code=201, summary="Create attribute")
@router.post("/", status_code=201, include_in_schema=False)
def create_attribute(data: AttributeCreate):
    scope = _normalize_scope(data.scope)
    bucket = _normalize_bucket(scope, data.bucket)
    table, target_col = TABLE_MAP[(scope, bucket)]
    row_id = execute(
        f"""
        INSERT INTO {table} ({target_col}, attribute, op, value)
        VALUES (%s, %s, %s, %s)
        """,
        (data.target, data.attribute, data.op, data.value),
    )
    uid = f"{scope}:{bucket}:{row_id}"
    return {"ok": True, "uid": uid}


@router.put("/{uid}", summary="Update attribute")
@router.put("/{uid}/", include_in_schema=False)
def update_attribute(uid: str, data: AttributeUpdate):
    scope, bucket, table, target_col, row_id = _parse_uid(uid)
    row = query(f"SELECT id FROM {table} WHERE id = %s", (row_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Attribute not found")

    fields = {}
    if data.target is not None:
        fields[target_col] = data.target
    if data.attribute is not None:
        fields["attribute"] = data.attribute
    if data.op is not None:
        fields["op"] = data.op
    if data.value is not None:
        fields["value"] = data.value

    if not fields:
        return {"ok": True, "message": "Nothing to update"}

    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [row_id]
    execute(f"UPDATE {table} SET {set_clause} WHERE id = %s", tuple(values))
    return {"ok": True, "uid": f"{scope}:{bucket}:{row_id}"}


@router.delete("/{uid}", summary="Delete attribute")
@router.delete("/{uid}/", include_in_schema=False)
def delete_attribute(uid: str):
    _, _, table, _, row_id = _parse_uid(uid)
    row = query(f"SELECT id FROM {table} WHERE id = %s", (row_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Attribute not found")
    execute(f"DELETE FROM {table} WHERE id = %s", (row_id,))
    return {"ok": True, "deleted": uid}
