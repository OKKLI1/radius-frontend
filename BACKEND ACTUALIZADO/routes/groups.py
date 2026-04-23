from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from core.database import query, execute, execute_many
from core.security import verify_token

router = APIRouter(prefix="/api/groups", tags=["Grupos"], dependencies=[Depends(verify_token)])


class GroupAttribute(BaseModel):
    attribute: str
    op: str = ":="
    value: str


class GroupCreate(BaseModel):
    groupname: str
    max_bandwidth_down: Optional[int] = None   # Kbps
    max_bandwidth_up: Optional[int] = None     # Kbps
    session_timeout: Optional[int] = None      # segundos
    idle_timeout: Optional[int] = None         # segundos


@router.get("", summary="x")
@router.get("/", include_in_schema=False, summary="Listar grupos")
def list_groups():
    """Lista todos los grupos con sus atributos de check y reply."""
    groups_check = query("SELECT DISTINCT groupname FROM radgroupcheck ORDER BY groupname")
    groups_reply = query("SELECT DISTINCT groupname FROM radgroupreply ORDER BY groupname")

    # Unir nombres únicos
    names = set(r["groupname"] for r in groups_check) | set(r["groupname"] for r in groups_reply)

    result = []
    for name in sorted(names):
        check_attrs = query("SELECT attribute, op, value FROM radgroupcheck WHERE groupname = %s", (name,))
        reply_attrs = query("SELECT attribute, op, value FROM radgroupreply WHERE groupname = %s", (name,))
        members = query("SELECT username FROM radusergroup WHERE groupname = %s", (name,))
        result.append({
            "groupname": name,
            "check_attributes": check_attrs,
            "reply_attributes": reply_attrs,
            "member_count": len(members),
        })
    return result


@router.get("/{groupname}", summary="Detalle de un grupo")
def get_group(groupname: str):
    check_attrs = query("SELECT attribute, op, value FROM radgroupcheck WHERE groupname = %s", (groupname,))
    reply_attrs = query("SELECT attribute, op, value FROM radgroupreply WHERE groupname = %s", (groupname,))
    members = query("SELECT username FROM radusergroup WHERE groupname = %s ORDER BY username", (groupname,))

    if not check_attrs and not reply_attrs:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    return {
        "groupname": groupname,
        "check_attributes": check_attrs,
        "reply_attributes": reply_attrs,
        "members": [m["username"] for m in members],
    }


@router.post("/", status_code=201, summary="Crear grupo con políticas")
def create_group(data: GroupCreate):
    statements = []

    # Atributos de reply (lo que FreeRADIUS envía de vuelta al NAS)
    if data.max_bandwidth_down:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'WISPr-Bandwidth-Max-Down', ':=', %s)",
            (data.groupname, str(data.max_bandwidth_down * 1000)),  # Kbps → bps
        ))
    if data.max_bandwidth_up:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'WISPr-Bandwidth-Max-Up', ':=', %s)",
            (data.groupname, str(data.max_bandwidth_up * 1000)),
        ))
    if data.session_timeout:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'Session-Timeout', ':=', %s)",
            (data.groupname, str(data.session_timeout)),
        ))
    if data.idle_timeout:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'Idle-Timeout', ':=', %s)",
            (data.groupname, str(data.idle_timeout)),
        ))

    if not statements:
        # Grupo vacío — inserta un placeholder para que exista
        statements.append((
            "INSERT INTO radgroupcheck (groupname, attribute, op, value) VALUES (%s, 'Auth-Type', ':=', 'Local')",
            (data.groupname,),
        ))

    execute_many(statements)
    return {"ok": True, "groupname": data.groupname}


@router.delete("/{groupname}", summary="Eliminar grupo")
def delete_group(groupname: str):
    execute_many([
        ("DELETE FROM radgroupcheck WHERE groupname = %s", (groupname,)),
        ("DELETE FROM radgroupreply WHERE groupname = %s", (groupname,)),
        # Nota: NO elimina los usuarios, solo los desasocia del grupo
        ("DELETE FROM radusergroup WHERE groupname = %s", (groupname,)),
    ])
    return {"ok": True, "deleted": groupname}


@router.post("/{groupname}/attributes/reply", summary="Agregar atributo de reply al grupo")
def add_reply_attribute(groupname: str, attr: GroupAttribute):
    execute(
        "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, %s, %s, %s)",
        (groupname, attr.attribute, attr.op, attr.value)
    )
    return {"ok": True}


@router.delete("/{groupname}/attributes/reply/{attribute}", summary="Eliminar atributo de reply del grupo")
def delete_reply_attribute(groupname: str, attribute: str):
    execute(
        "DELETE FROM radgroupreply WHERE groupname = %s AND attribute = %s",
        (groupname, attribute)
    )
    return {"ok": True}
