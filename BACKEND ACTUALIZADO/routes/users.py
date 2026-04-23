from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from core.database import query, execute, execute_many
from core.security import verify_token

router = APIRouter(prefix="/api/users", tags=["Usuarios"], dependencies=[Depends(verify_token)])


# ── Schemas ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str
    group: Optional[str] = None
    expiry: Optional[str] = None        # formato: "2027-01-01" → se guarda como Expiration
    simultaneous_use: Optional[int] = 1  # máximo de sesiones simultáneas
    max_octets: Optional[int] = None    # límite de datos en bytes (None = sin límite)


class UserUpdate(BaseModel):
    password: Optional[str] = None
    group: Optional[str] = None
    expiry: Optional[str] = None
    simultaneous_use: Optional[int] = None
    max_octets: Optional[int] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_user_attributes(username: str) -> dict:
    """Retorna todos los atributos de un usuario desde radcheck + radusergroup."""
    attrs = query(
        "SELECT attribute, op, value FROM radcheck WHERE username = %s",
        (username,)
    )
    group_row = query(
        "SELECT groupname FROM radusergroup WHERE username = %s ORDER BY priority LIMIT 1",
        (username,),
        fetchone=True,
    )
    reply_attrs = query(
        "SELECT attribute, op, value FROM radreply WHERE username = %s",
        (username,)
    )
    return {
        "username": username,
        "attributes": attrs,
        "group": group_row["groupname"] if group_row else None,
        "reply_attributes": reply_attrs,
    }


def _user_exists(username: str) -> bool:
    row = query(
        "SELECT 1 FROM radcheck WHERE username = %s LIMIT 1",
        (username,),
        fetchone=True,
    )
    return row is not None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("", summary="Listar todos los usuarios")
@router.get("/", include_in_schema=False)
def list_users():
    """
    Retorna la lista de usuarios con su grupo y atributos básicos.
    """
    rows = query("""
        SELECT
            rc.username,
            rc.value        AS password,
            rug.groupname   AS grupo,
            (
                SELECT value FROM radcheck
                WHERE username = rc.username AND attribute = 'Expiration'
                LIMIT 1
            ) AS expiry,
            (
                SELECT value FROM radcheck
                WHERE username = rc.username AND attribute = 'Simultaneous-Use'
                LIMIT 1
            ) AS simultaneous_use
        FROM radcheck rc
        LEFT JOIN radusergroup rug ON rc.username = rug.username
        WHERE rc.attribute = 'Cleartext-Password'
        ORDER BY rc.username
    """)
    return rows


@router.get("/{username}", summary="Detalle de un usuario")
def get_user(username: str):
    if not _user_exists(username):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _get_user_attributes(username)


@router.post("", status_code=201, summary="Crear usuario")
@router.post("/", status_code=201, include_in_schema=False)
def create_user(data: UserCreate):
    if _user_exists(data.username):
        raise HTTPException(status_code=409, detail="El usuario ya existe")

    statements = [
        (
            "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Cleartext-Password', ':=', %s)",
            (data.username, data.password),
        ),
        (
            "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Simultaneous-Use', ':=', %s)",
            (data.username, str(data.simultaneous_use or 1)),
        ),
    ]

    if data.expiry:
        statements.append((
            "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Expiration', ':=', %s)",
            (data.username, data.expiry),
        ))

    if data.group:
        statements.append((
            "INSERT INTO radusergroup (username, groupname, priority) VALUES (%s, %s, 1)",
            (data.username, data.group),
        ))

    if data.max_octets:
        statements.append((
            "INSERT INTO radreply (username, attribute, op, value) VALUES (%s, 'ChilliSpot-Max-Total-Octets', ':=', %s)",
            (data.username, str(data.max_octets)),
        ))

    execute_many(statements)
    return {"ok": True, "username": data.username}


@router.put("/{username}", summary="Actualizar usuario")
@router.put("/{username}/", include_in_schema=False)
def update_user(username: str, data: UserUpdate):
    if not _user_exists(username):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    statements = []

    if data.password is not None:
        statements.append((
            "UPDATE radcheck SET value = %s WHERE username = %s AND attribute = 'Cleartext-Password'",
            (data.password, username),
        ))

    if data.expiry is not None:
        # Upsert: actualiza si existe, inserta si no
        existing = query(
            "SELECT id FROM radcheck WHERE username = %s AND attribute = 'Expiration'",
            (username,), fetchone=True
        )
        if existing:
            statements.append((
                "UPDATE radcheck SET value = %s WHERE username = %s AND attribute = 'Expiration'",
                (data.expiry, username),
            ))
        else:
            statements.append((
                "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Expiration', ':=', %s)",
                (username, data.expiry),
            ))

    if data.simultaneous_use is not None:
        statements.append((
            "UPDATE radcheck SET value = %s WHERE username = %s AND attribute = 'Simultaneous-Use'",
            (str(data.simultaneous_use), username),
        ))

    if data.group is not None:
        statements.append((
            "DELETE FROM radusergroup WHERE username = %s",
            (username,),
        ))
        statements.append((
            "INSERT INTO radusergroup (username, groupname, priority) VALUES (%s, %s, 1)",
            (username, data.group),
        ))

    if statements:
        execute_many(statements)

    return {"ok": True, "username": username}


@router.delete("/{username}", summary="Eliminar usuario")
@router.delete("/{username}/", include_in_schema=False)
def delete_user(username: str):
    if not _user_exists(username):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    execute_many([
        ("DELETE FROM radcheck WHERE username = %s", (username,)),
        ("DELETE FROM radreply WHERE username = %s", (username,)),
        ("DELETE FROM radusergroup WHERE username = %s", (username,)),
    ])
    return {"ok": True, "deleted": username}


@router.post("/{username}/disable", summary="Deshabilitar usuario")
@router.post("/{username}/disable/", include_in_schema=False)
def disable_user(username: str):
    """Agrega el atributo Auth-Type := Reject para bloquear al usuario."""
    if not _user_exists(username):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    existing = query(
        "SELECT id FROM radcheck WHERE username = %s AND attribute = 'Auth-Type'",
        (username,), fetchone=True
    )
    if not existing:
        execute(
            "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Auth-Type', ':=', 'Reject')",
            (username,)
        )
    return {"ok": True, "status": "disabled"}


@router.post("/{username}/enable", summary="Habilitar usuario")
@router.post("/{username}/enable/", include_in_schema=False)
def enable_user(username: str):
    """Elimina el atributo Auth-Type := Reject para desbloquear al usuario."""
    if not _user_exists(username):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    execute(
        "DELETE FROM radcheck WHERE username = %s AND attribute = 'Auth-Type'",
        (username,)
    )
    return {"ok": True, "status": "enabled"}
