import csv
import io
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from core.database import query, execute_many
from core.security import verify_token

router = APIRouter(prefix="/api/batch", tags=["Batch Users"], dependencies=[Depends(verify_token)])


def _user_exists(username: str) -> bool:
    row = query(
        "SELECT 1 FROM radcheck WHERE username = %s AND attribute = 'Cleartext-Password' LIMIT 1",
        (username,), fetchone=True
    )
    return row is not None


@router.post("/preview", summary="Previsualizar CSV antes de importar")
async def preview_csv(file: UploadFile = File(...)):
    """
    Lee el CSV y retorna una lista de usuarios con validación previa.
    No crea nada en la base de datos.
    Formato CSV esperado: username,password,group,expiry
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser .csv")

    content = await file.read()
    text = content.decode('utf-8-sig')  # utf-8-sig maneja BOM de Excel
    reader = csv.DictReader(io.StringIO(text))

    # Validar cabeceras
    required = {'username', 'password'}
    if not reader.fieldnames or not required.issubset(set(f.strip().lower() for f in reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"El CSV debe tener al menos las columnas: username, password. Encontradas: {reader.fieldnames}"
        )

    preview = []
    seen = set()

    for i, row in enumerate(reader, start=2):
        # Normalizar keys
        row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

        username = row.get('username', '').strip()
        password = row.get('password', '').strip()
        group    = row.get('group', '').strip()
        expiry   = row.get('expiry', '').strip()

        errors = []

        if not username:
            errors.append("Usuario vacío")
        if not password:
            errors.append("Contraseña vacía")
        if len(username) > 64:
            errors.append("Usuario demasiado largo (máx 64 chars)")
        if username in seen:
            errors.append("Usuario duplicado en el CSV")
        if _user_exists(username):
            errors.append("Ya existe en la base de datos")

        seen.add(username)

        preview.append({
            "line":     i,
            "username": username,
            "password": password,
            "group":    group or None,
            "expiry":   expiry or None,
            "status":   "error" if errors else "ok",
            "errors":   errors,
        })

    total   = len(preview)
    ok      = sum(1 for r in preview if r["status"] == "ok")
    errors  = total - ok

    return {
        "total":   total,
        "ok":      ok,
        "errors":  errors,
        "preview": preview,
    }


@router.post("/import", summary="Importar usuarios desde CSV")
async def import_csv(file: UploadFile = File(...)):
    """
    Importa usuarios válidos del CSV a la base de datos.
    Omite los que ya existen o tienen errores.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser .csv")

    content = await file.read()
    text = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))

    created = []
    skipped = []

    for row in reader:
        row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

        username = row.get('username', '').strip()
        password = row.get('password', '').strip()
        group    = row.get('group', '').strip()
        expiry   = row.get('expiry', '').strip()

        if not username or not password:
            skipped.append({"username": username, "reason": "Datos incompletos"})
            continue

        if _user_exists(username):
            skipped.append({"username": username, "reason": "Ya existe"})
            continue

        try:
            statements = [
                (
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Cleartext-Password', ':=', %s)",
                    (username, password),
                ),
                (
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Simultaneous-Use', ':=', '1')",
                    (username,),
                ),
            ]
            if expiry:
                statements.append((
                    "INSERT INTO radcheck (username, attribute, op, value) VALUES (%s, 'Expiration', ':=', %s)",
                    (username, expiry),
                ))
            if group:
                statements.append((
                    "INSERT INTO radusergroup (username, groupname, priority) VALUES (%s, %s, 1)",
                    (username, group),
                ))
            execute_many(statements)
            created.append(username)
        except Exception as e:
            skipped.append({"username": username, "reason": str(e)})

    return {
        "created_count": len(created),
        "skipped_count": len(skipped),
        "created": created,
        "skipped": skipped,
    }


@router.get("/export", summary="Exportar usuarios a CSV")
def export_csv():
    """
    Exporta todos los usuarios actuales como archivo CSV descargable.
    """
    rows = query("""
        SELECT
            rc.username,
            rc.value AS password,
            COALESCE(rug.groupname, '') AS group_name,
            COALESCE(
                (SELECT value FROM radcheck WHERE username = rc.username AND attribute = 'Expiration' LIMIT 1),
                ''
            ) AS expiry
        FROM radcheck rc
        LEFT JOIN radusergroup rug ON rc.username = rug.username
        WHERE rc.attribute = 'Cleartext-Password'
        ORDER BY rc.username
    """)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['username', 'password', 'group', 'expiry'])
    for r in rows:
        writer.writerow([r['username'], r['password'], r['group_name'], r['expiry']])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=usuarios_radius.csv"}
    )


@router.get("/template", summary="Descargar plantilla CSV de ejemplo")
def download_template():
    """Descarga un CSV de ejemplo para usar como plantilla."""
    template = "username,password,group,expiry\n"
    template += "usuario1,contraseña1,empleados,2027-12-31\n"
    template += "usuario2,contraseña2,visitantes,2026-06-30\n"
    template += "usuario3,contraseña3,admin,\n"

    return StreamingResponse(
        iter([template]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plantilla_usuarios.csv"}
    )
