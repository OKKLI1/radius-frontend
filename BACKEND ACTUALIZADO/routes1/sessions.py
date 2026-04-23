from fastapi import APIRouter, Depends, Query
from typing import Optional
from core.database import query, execute
from core.security import verify_token

router = APIRouter(prefix="/api/sessions", tags=["Sesiones"], dependencies=[Depends(verify_token)])


def _format_bytes(b: int) -> str:
    """Convierte bytes a formato legible."""
    if b is None:
        return "0 B"
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if b < 1024:
            return f"{b:.1f} {unit}"
        b /= 1024
    return f"{b:.1f} PB"


@router.get("/active", summary="Sesiones activas en este momento")
def active_sessions():
    """
    Retorna todas las sesiones donde acctstoptime IS NULL
    (usuario conectado en este momento).
    """
    rows = query("""
        SELECT
            radacctid,
            username,
            nasipaddress,
            nasportid,
            framedipaddress,
            callingstationid    AS mac_address,
            acctstarttime       AS connected_since,
            TIMESTAMPDIFF(SECOND, acctstarttime, NOW()) AS duration_seconds,
            acctinputoctets     AS bytes_upload,
            acctoutputoctets    AS bytes_download,
            (acctinputoctets + acctoutputoctets) AS bytes_total
        FROM radacct
        WHERE acctstoptime IS NULL
        ORDER BY acctstarttime DESC
    """)

    # Agregar campos legibles
    for r in rows:
        r["upload_readable"]   = _format_bytes(r["bytes_upload"])
        r["download_readable"] = _format_bytes(r["bytes_download"])
        r["total_readable"]    = _format_bytes(r["bytes_total"])

        # Convertir duración a hh:mm:ss
        secs = r["duration_seconds"] or 0
        h, rem = divmod(secs, 3600)
        m, s = divmod(rem, 60)
        r["duration_human"] = f"{h:02d}:{m:02d}:{s:02d}"

    return rows


@router.get("/history", summary="Historial de sesiones")
def session_history(
    username: Optional[str] = Query(None, description="Filtrar por usuario"),
    nas_ip: Optional[str] = Query(None, description="Filtrar por IP del NAS"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """
    Historial de sesiones cerradas. Soporta filtros opcionales.
    """
    conditions = ["acctstoptime IS NOT NULL"]
    params = []

    if username:
        conditions.append("username = %s")
        params.append(username)
    if nas_ip:
        conditions.append("nasipaddress = %s")
        params.append(nas_ip)

    where = " AND ".join(conditions)
    params += [limit, offset]

    rows = query(f"""
        SELECT
            radacctid,
            username,
            nasipaddress,
            framedipaddress,
            callingstationid    AS mac_address,
            acctstarttime,
            acctstoptime,
            acctterminatecause  AS disconnect_reason,
            acctsessiontime     AS duration_seconds,
            acctinputoctets     AS bytes_upload,
            acctoutputoctets    AS bytes_download
        FROM radacct
        WHERE {where}
        ORDER BY acctstoptime DESC
        LIMIT %s OFFSET %s
    """, tuple(params))

    for r in rows:
        r["upload_readable"]   = _format_bytes(r["bytes_upload"])
        r["download_readable"] = _format_bytes(r["bytes_download"])

    return rows


@router.delete("/active/{radacctid}", summary="Desconectar sesión activa")
def disconnect_session(radacctid: int):
    """
    Marca la sesión como finalizada manualmente.
    Nota: Esto solo actualiza la BD. Para desconexión real del cliente
    el NAS debe soportar CoA/Disconnect-Message (RFC 3576).
    """
    execute("""
        UPDATE radacct
        SET acctstoptime = NOW(),
            acctterminatecause = 'Admin-Reset'
        WHERE radacctid = %s AND acctstoptime IS NULL
    """, (radacctid,))
    return {"ok": True, "radacctid": radacctid}
