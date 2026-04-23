from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.database import query, execute, execute_many
from core.security import verify_token

router = APIRouter(prefix="/api/profiles", tags=["Perfiles de Ancho de Banda"], dependencies=[Depends(verify_token)])


class ProfileCreate(BaseModel):
    name: str                              # Nombre del perfil ej: "Plan 10Mbps"
    description: Optional[str] = ""
    bandwidth_down: Optional[int] = None  # Kbps bajada
    bandwidth_up: Optional[int] = None    # Kbps subida
    session_timeout: Optional[int] = None # segundos
    idle_timeout: Optional[int] = None    # segundos
    max_octets: Optional[int] = None      # bytes totales (datos máximos)
    simultaneous_use: Optional[int] = 1


class ProfileUpdate(BaseModel):
    description: Optional[str] = None
    bandwidth_down: Optional[int] = None
    bandwidth_up: Optional[int] = None
    session_timeout: Optional[int] = None
    idle_timeout: Optional[int] = None
    max_octets: Optional[int] = None
    simultaneous_use: Optional[int] = None


def _build_reply_attrs(data, groupname: str) -> list:
    """Construye la lista de atributos RADIUS para el perfil."""
    statements = []

    if data.bandwidth_down:
        # WISPr-Bandwidth-Max-Down en bps
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'WISPr-Bandwidth-Max-Down', ':=', %s)",
            (groupname, str(data.bandwidth_down * 1000)),
        ))
        # Mikrotik
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'Mikrotik-Rate-Limit', ':=', %s)",
            (groupname, f"{data.bandwidth_up or data.bandwidth_down}k/{data.bandwidth_down}k"),
        ))

    if data.bandwidth_up:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'WISPr-Bandwidth-Max-Up', ':=', %s)",
            (groupname, str(data.bandwidth_up * 1000)),
        ))

    if data.session_timeout:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'Session-Timeout', ':=', %s)",
            (groupname, str(data.session_timeout)),
        ))

    if data.idle_timeout:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'Idle-Timeout', ':=', %s)",
            (groupname, str(data.idle_timeout)),
        ))

    if data.max_octets:
        statements.append((
            "INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (%s, 'ChilliSpot-Max-Total-Octets', ':=', %s)",
            (groupname, str(data.max_octets)),
        ))

    if data.simultaneous_use:
        statements.append((
            "INSERT INTO radgroupcheck (groupname, attribute, op, value) VALUES (%s, 'Simultaneous-Use', ':=', %s)",
            (groupname, str(data.simultaneous_use)),
        ))

    return statements


@router.get("", summary="Listar perfiles")
@router.get("/", include_in_schema=False)
def list_profiles():
    """Lista todos los grupos que tienen atributos de ancho de banda."""
    groups = query("""
        SELECT DISTINCT groupname FROM radgroupreply
        WHERE attribute IN ('WISPr-Bandwidth-Max-Down', 'WISPr-Bandwidth-Max-Up',
                           'Session-Timeout', 'Mikrotik-Rate-Limit')
        ORDER BY groupname
    """)

    result = []
    for g in groups:
        name = g['groupname']
        attrs = query("SELECT attribute, op, value FROM radgroupreply WHERE groupname = %s", (name,))
        check_attrs = query("SELECT attribute, op, value FROM radgroupcheck WHERE groupname = %s", (name,))
        members = query("SELECT COUNT(*) as total FROM radusergroup WHERE groupname = %s", (name,), fetchone=True)

        # Extraer valores legibles
        def get_attr(lst, attr):
            for a in lst:
                if a['attribute'] == attr:
                    return a['value']
            return None

        down_bps = get_attr(attrs, 'WISPr-Bandwidth-Max-Down')
        up_bps = get_attr(attrs, 'WISPr-Bandwidth-Max-Up')
        session = get_attr(attrs, 'Session-Timeout')
        idle = get_attr(attrs, 'Idle-Timeout')
        octets = get_attr(attrs, 'ChilliSpot-Max-Total-Octets')
        sim_use = get_attr(check_attrs, 'Simultaneous-Use')
        rate_limit = get_attr(attrs, 'Mikrotik-Rate-Limit')

        result.append({
            "name":             name,
            "bandwidth_down_kbps": int(int(down_bps) / 1000) if down_bps else None,
            "bandwidth_up_kbps":   int(int(up_bps) / 1000) if up_bps else None,
            "session_timeout":  int(session) if session else None,
            "idle_timeout":     int(idle) if idle else None,
            "max_octets":       int(octets) if octets else None,
            "simultaneous_use": int(sim_use) if sim_use else 1,
            "mikrotik_rate":    rate_limit,
            "member_count":     members['total'] if members else 0,
            "reply_attributes": attrs,
        })

    return result


@router.post("", status_code=201, summary="Crear perfil de ancho de banda")
@router.post("/", status_code=201, include_in_schema=False)
def create_profile(data: ProfileCreate):
    # Verificar que no exista
    existing = query(
        "SELECT 1 FROM radgroupreply WHERE groupname = %s LIMIT 1",
        (data.name,), fetchone=True
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un perfil con ese nombre")

    statements = _build_reply_attrs(data, data.name)

    if not statements:
        raise HTTPException(status_code=400, detail="Debes definir al menos un parámetro de ancho de banda")

    execute_many(statements)
    return {"ok": True, "name": data.name}


@router.put("/{name}", summary="Actualizar perfil")
def update_profile(name: str, data: ProfileUpdate):
    # Eliminar atributos existentes y recrear
    execute_many([
        ("DELETE FROM radgroupreply WHERE groupname = %s", (name,)),
        ("DELETE FROM radgroupcheck WHERE groupname = %s AND attribute = 'Simultaneous-Use'", (name,)),
    ])

    # Reconstruir con nuevos valores
    class TempData:
        pass
    temp = TempData()
    temp.bandwidth_down = data.bandwidth_down
    temp.bandwidth_up = data.bandwidth_up
    temp.session_timeout = data.session_timeout
    temp.idle_timeout = data.idle_timeout
    temp.max_octets = data.max_octets
    temp.simultaneous_use = data.simultaneous_use

    statements = _build_reply_attrs(temp, name)
    if statements:
        execute_many(statements)

    return {"ok": True, "name": name}


@router.delete("/{name}", summary="Eliminar perfil")
def delete_profile(name: str):
    execute_many([
        ("DELETE FROM radgroupreply WHERE groupname = %s", (name,)),
        ("DELETE FROM radgroupcheck WHERE groupname = %s", (name,)),
        ("DELETE FROM radusergroup WHERE groupname = %s", (name,)),
    ])
    return {"ok": True, "deleted": name}


@router.post("/{name}/assign/{username}", summary="Asignar perfil a usuario")
def assign_to_user(name: str, username: str):
    """Asigna un perfil directamente a un usuario (no via grupo)."""
    # Verificar usuario existe
    user = query(
        "SELECT 1 FROM radcheck WHERE username = %s AND attribute = 'Cleartext-Password' LIMIT 1",
        (username,), fetchone=True
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar o insertar grupo
    existing = query(
        "SELECT id FROM radusergroup WHERE username = %s LIMIT 1",
        (username,), fetchone=True
    )
    if existing:
        execute(
            "UPDATE radusergroup SET groupname = %s WHERE username = %s",
            (name, username)
        )
    else:
        execute(
            "INSERT INTO radusergroup (username, groupname, priority) VALUES (%s, %s, 1)",
            (username, name)
        )

    return {"ok": True, "username": username, "profile": name}
