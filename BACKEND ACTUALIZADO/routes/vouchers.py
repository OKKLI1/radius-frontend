import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io, csv
from core.database import query, execute, execute_many
from core.security import verify_token

router = APIRouter(prefix="/api/vouchers", tags=["Vouchers / Hotspot"], dependencies=[Depends(verify_token)])


class VoucherBatch(BaseModel):
    quantity: int = 10           # Cuántos vouchers generar
    profile: str                 # Nombre del perfil de ancho de banda
    prefix: Optional[str] = ""   # Prefijo del código ej: "VIP-"
    validity_days: Optional[int] = 30   # Días de validez desde activación
    simultaneous_use: Optional[int] = 1


class VoucherUpdate(BaseModel):
    profile: Optional[str] = None
    validity_days: Optional[int] = None
    simultaneous_use: Optional[int] = None


def _generate_code(prefix: str = "", length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=length))
    return f"{prefix}{code}"


def _code_exists(code: str) -> bool:
    return query(
        "SELECT 1 FROM radcheck WHERE username = %s LIMIT 1",
        (code,), fetchone=True
    ) is not None


@router.get("", summary="Listar vouchers")
@router.get("/", include_in_schema=False)
def list_vouchers(profile: Optional[str] = None, status: Optional[str] = None):
    """Lista todos los vouchers generados."""
    conditions = ["rc.attribute = 'Cleartext-Password'", "rc.username LIKE 'VCH-%' OR rug.groupname IS NOT NULL"]
    params = []

    rows = query("""
        SELECT
            rc.username                     AS code,
            rc.value                        AS password,
            rug.groupname                   AS profile,
            (SELECT value FROM radcheck WHERE username = rc.username AND attribute = 'Expiration' LIMIT 1) AS expiry,
            (SELECT value FROM radcheck WHERE username = rc.username AND attribute = 'Simultaneous-Use' LIMIT 1) AS simultaneous_use,
            (SELECT COUNT(*) FROM radacct WHERE username = rc.username AND acctstoptime IS NULL) AS active_sessions,
            (SELECT acctstarttime FROM radacct WHERE username = rc.username ORDER BY acctstarttime DESC LIMIT 1) AS last_used
        FROM radcheck rc
        LEFT JOIN radusergroup rug ON rc.username = rug.username
        WHERE rc.attribute = 'Cleartext-Password'
          AND rc.username LIKE 'VCH-%%'
        ORDER BY rc.username
    """)

    return rows


@router.post("/generate", status_code=201, summary="Generar lote de vouchers")
@router.post("/generate/", status_code=201, include_in_schema=False)
def generate_vouchers(data: VoucherBatch):
    if data.quantity < 1 or data.quantity > 500:
        raise HTTPException(status_code=400, detail="La cantidad debe estar entre 1 y 500")

    # Verificar que el perfil existe
    profile_exists = query(
        "SELECT 1 FROM radgroupreply WHERE groupname = %s LIMIT 1",
        (data.profile,), fetchone=True
    )
    if not profile_exists:
        raise HTTPException(status_code=404, detail=f"Perfil '{data.profile}' no encontrado")

    created = []
    expiry_date = (datetime.now() + timedelta(days=data.validity_days)).strftime("%Y-%m-%d") if data.validity_days else None

    for _ in range(data.quantity):
        # Generar código único
        attempts = 0
        while attempts < 10:
            code = f"VCH-{_generate_code(data.prefix)}"
            if not _code_exists(code):
                break
            attempts += 1

        password = _generate_code(length=10)

        statements = [
            ("INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Cleartext-Password', ':=', %s)", (code, password)),
            ("INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Simultaneous-Use', ':=', %s)", (code, str(data.simultaneous_use))),
            ("INSERT INTO radusergroup (username, groupname, priority) VALUES (%s, %s, 1)", (code, data.profile)),
        ]
        if expiry_date:
            statements.append((
                "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Expiration', ':=', %s)",
                (code, expiry_date)
            ))

        execute_many(statements)
        created.append({"code": code, "password": password, "profile": data.profile, "expiry": expiry_date})

    return {
        "generated": len(created),
        "profile": data.profile,
        "vouchers": created,
    }


@router.get("/export", summary="Exportar vouchers a CSV")
def export_vouchers():
    rows = query("""
        SELECT
            rc.username AS code,
            rc.value    AS password,
            rug.groupname AS profile,
            (SELECT value FROM radcheck WHERE username = rc.username AND attribute = 'Expiration' LIMIT 1) AS expiry
        FROM radcheck rc
        LEFT JOIN radusergroup rug ON rc.username = rug.username
        WHERE rc.attribute = 'Cleartext-Password' AND rc.username LIKE 'VCH-%%'
        ORDER BY rc.username
    """)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['codigo', 'contraseña', 'perfil', 'vencimiento'])
    for r in rows:
        writer.writerow([r['code'], r['password'], r['profile'], r['expiry'] or ''])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vouchers.csv"}
    )


@router.delete("/{code}", summary="Eliminar voucher")
@router.delete("/{code}/", include_in_schema=False)
def delete_voucher(code: str):
    execute_many([
        ("DELETE FROM radcheck WHERE username = %s", (code,)),
        ("DELETE FROM radusergroup WHERE username = %s", (code,)),
    ])
    return {"ok": True, "deleted": code}


@router.delete("/bulk/all", summary="Eliminar todos los vouchers")
def delete_all_vouchers():
    """Elimina TODOS los vouchers (usuarios que empiezan con VCH-)."""
    vouchers = query("SELECT username FROM radcheck WHERE username LIKE 'VCH-%%' AND attribute = 'Cleartext-Password'")
    for v in vouchers:
        execute_many([
            ("DELETE FROM radcheck WHERE username = %s", (v['username'],)),
            ("DELETE FROM radusergroup WHERE username = %s", (v['username'],)),
        ])
    return {"ok": True, "deleted": len(vouchers)}
