import os
import smtplib
import subprocess
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.config import settings
from core.database import execute, query
from core.security import verify_token

router = APIRouter(prefix="/api/config", tags=["Configuracion"], dependencies=[Depends(verify_token)])


def _run_cmd(cmd: str) -> dict:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=12)
        return {"output": result.stdout.strip(), "error": result.stderr.strip(), "code": result.returncode}
    except Exception as e:
        return {"output": "", "error": str(e), "code": -1}


def _service_status(name: str) -> bool:
    r = _run_cmd(f"systemctl is-active {name}")
    return r["output"] == "active"


def _env_path() -> str:
    candidates = [
        "/opt/radius-backend/.env",
        str(Path(__file__).resolve().parents[1] / ".env"),
        str(Path.cwd() / ".env"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return "/opt/radius-backend/.env"


def _ensure_config_tables() -> None:
    try:
        execute(
            """
            CREATE TABLE IF NOT EXISTS axio_gui_operators (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(64) NOT NULL UNIQUE,
                full_name VARCHAR(120) NULL,
                email VARCHAR(160) NULL,
                role VARCHAR(30) NOT NULL DEFAULT 'viewer',
                active TINYINT(1) NOT NULL DEFAULT 1,
                last_login DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )

        execute(
            """
            CREATE TABLE IF NOT EXISTS axio_backup_policy (
                id TINYINT PRIMARY KEY,
                enabled TINYINT(1) NOT NULL DEFAULT 0,
                frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
                retention_days INT NOT NULL DEFAULT 14,
                backup_path VARCHAR(255) NOT NULL DEFAULT '/opt/radius-backups',
                last_run DATETIME NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )

        execute(
            """
            CREATE TABLE IF NOT EXISTS axio_backup_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                status VARCHAR(20) NOT NULL,
                started_at DATETIME NOT NULL,
                finished_at DATETIME NULL,
                notes TEXT NULL,
                snapshot_json LONGTEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        execute(
            """
            CREATE TABLE IF NOT EXISTS axio_mail_settings (
                id TINYINT PRIMARY KEY,
                smtp_host VARCHAR(160) NULL,
                smtp_port INT NOT NULL DEFAULT 587,
                smtp_user VARCHAR(160) NULL,
                smtp_password VARCHAR(255) NULL,
                from_email VARCHAR(160) NULL,
                use_tls TINYINT(1) NOT NULL DEFAULT 1,
                use_ssl TINYINT(1) NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )

        execute(
            """
            CREATE TABLE IF NOT EXISTS axio_mail_templates (
                template_key VARCHAR(60) PRIMARY KEY,
                subject VARCHAR(180) NOT NULL,
                body TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )

        existing_policy = query("SELECT id FROM axio_backup_policy WHERE id = 1", fetchone=True)
        if not existing_policy:
            execute(
                """
                INSERT INTO axio_backup_policy (id, enabled, frequency, retention_days, backup_path)
                VALUES (1, 0, 'daily', 14, '/opt/radius-backups')
                """
            )

        existing_mail = query("SELECT id FROM axio_mail_settings WHERE id = 1", fetchone=True)
        if not existing_mail:
            execute(
                """
                INSERT INTO axio_mail_settings (id, smtp_host, smtp_port, smtp_user, smtp_password, from_email, use_tls, use_ssl)
                VALUES (1, '', 587, '', '', '', 1, 0)
                """
            )

        defaults = {
            "welcome": ("Bienvenido a AxioRadius", "Hola {{user}}, tu cuenta ha sido creada correctamente."),
            "alert": ("Alerta del sistema", "Se detecto un evento importante en el sistema RADIUS."),
            "recovery": ("Recuperacion de acceso", "Hola {{user}}, usa este enlace para recuperar tu acceso."),
        }
        for key, (subject, body) in defaults.items():
            row = query("SELECT template_key FROM axio_mail_templates WHERE template_key = %s", (key,), fetchone=True)
            if not row:
                execute(
                    "INSERT INTO axio_mail_templates (template_key, subject, body) VALUES (%s, %s, %s)",
                    (key, subject, body),
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inicializando tablas de configuracion: {e}")


@router.get("/server", summary="Informacion del servidor")
@router.get("/server/", include_in_schema=False)
def server_info():
    hostname = _run_cmd("hostname")["output"]
    uptime = _run_cmd("uptime -p")["output"]
    os_info = _run_cmd("lsb_release -d | cut -f2")["output"]
    cpu_usage = _run_cmd("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'")["output"]
    mem = _run_cmd("free -m | awk 'NR==2{printf \"%s/%s MB (%.1f%%)\", $3,$2,$3*100/$2}'")["output"]
    disk = _run_cmd("df -h / | awk 'NR==2{print $3\"/\"$2\" (\"$5\")\"}'")["output"]
    ip_addr = _run_cmd("hostname -I | awk '{print $1}'")["output"]

    db_users = query("SELECT COUNT(*) AS total FROM radcheck WHERE attribute='Cleartext-Password'", fetchone=True)
    db_nas = query("SELECT COUNT(*) AS total FROM nas", fetchone=True)
    db_sessions = query("SELECT COUNT(*) AS total FROM radacct WHERE acctstoptime IS NULL", fetchone=True)
    db_vouchers = query("SELECT COUNT(*) AS total FROM radcheck WHERE username LIKE 'VCH-%' AND attribute='Cleartext-Password'", fetchone=True)

    return {
        "system": {
            "hostname": hostname,
            "os": os_info,
            "uptime": uptime,
            "ip": ip_addr,
            "cpu_usage": f"{cpu_usage}%" if cpu_usage else "-",
            "memory": mem,
            "disk": disk,
        },
        "services": {
            "freeradius": _service_status("freeradius"),
            "mariadb": _service_status("mariadb") or _service_status("mysql"),
            "apache": _service_status("apache2"),
            "radius_api": _service_status("radius-api"),
        },
        "database": {
            "users": int(db_users["total"] if db_users else 0),
            "nas": int(db_nas["total"] if db_nas else 0),
            "sessions": int(db_sessions["total"] if db_sessions else 0),
            "vouchers": int(db_vouchers["total"] if db_vouchers else 0),
        },
    }


@router.get("/reporting/summary", summary="Resumen de reporting")
@router.get("/reporting/summary/", include_in_schema=False)
def reporting_summary():
    auth_24h = query(
        """
        SELECT
          SUM(reply='Access-Accept') AS accepted,
          SUM(reply='Access-Reject') AS rejected,
          COUNT(*) AS total
        FROM radpostauth
        WHERE authdate >= NOW() - INTERVAL 24 HOUR
        """,
        fetchone=True,
    )

    auth_7d = query(
        """
        SELECT
          SUM(reply='Access-Accept') AS accepted,
          SUM(reply='Access-Reject') AS rejected,
          COUNT(*) AS total
        FROM radpostauth
        WHERE authdate >= NOW() - INTERVAL 7 DAY
        """,
        fetchone=True,
    )

    traffic_24h = query(
        """
        SELECT SUM(COALESCE(acctinputoctets,0) + COALESCE(acctoutputoctets,0)) AS total_bytes
        FROM radacct
        WHERE acctstarttime >= NOW() - INTERVAL 24 HOUR
        """,
        fetchone=True,
    )

    return {
        "auth_24h": auth_24h or {"accepted": 0, "rejected": 0, "total": 0},
        "auth_7d": auth_7d or {"accepted": 0, "rejected": 0, "total": 0},
        "traffic_24h": int(traffic_24h["total_bytes"] if traffic_24h and traffic_24h["total_bytes"] is not None else 0),
    }


@router.post("/services/{service}/restart", summary="Reiniciar servicio")
@router.post("/services/{service}/restart/", include_in_schema=False)
def restart_service(service: str):
    raise HTTPException(
        status_code=403,
        detail="Reinicio remoto deshabilitado por politica. Usa solo monitoreo de estado de servicios.",
    )


@router.get("/freeradius/log", summary="Ultimas lineas del log de FreeRADIUS")
@router.get("/freeradius/log/", include_in_schema=False)
def freeradius_log(lines: int = 50):
    result = _run_cmd(f"tail -n {lines} /var/log/freeradius/radius.log")
    return {"lines": result["output"].split("\n") if result["output"] else []}


@router.get("/gui", summary="Configuracion actual del panel")
@router.get("/gui/", include_in_schema=False)
def get_gui_config():
    return {
        "admin_user": settings.GUI_ADMIN_USER,
        "db_host": settings.DB_HOST,
        "db_port": settings.DB_PORT,
        "db_name": settings.DB_NAME,
        "db_user": settings.DB_USER,
        "api_port": 8080,
        "token_expire": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    }


class GuiConfigUpdate(BaseModel):
    admin_user: Optional[str] = None
    admin_password: Optional[str] = None
    token_expire: Optional[int] = None


@router.put("/gui", summary="Actualizar configuracion del panel")
@router.put("/gui/", include_in_schema=False)
def update_gui_config(data: GuiConfigUpdate):
    env_path = _env_path()

    if not os.path.exists(env_path):
        raise HTTPException(status_code=404, detail="Archivo .env no encontrado")

    try:
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo leer .env ({env_path}): {e}")

    updates = {}
    if data.admin_user:
        updates["GUI_ADMIN_USER"] = data.admin_user
    if data.admin_password:
        updates["GUI_ADMIN_PASSWORD"] = data.admin_password
    if data.token_expire is not None:
        updates["ACCESS_TOKEN_EXPIRE_MINUTES"] = str(data.token_expire)

    if not updates:
        return {"ok": True, "message": "Sin cambios"}

    existing_keys = set()
    new_lines = []
    for line in lines:
        updated = False
        for key, val in updates.items():
            if line.startswith(f"{key}="):
                new_lines.append(f"{key}={val}\n")
                existing_keys.add(key)
                updated = True
                break
        if not updated:
            new_lines.append(line)

    for key, val in updates.items():
        if key not in existing_keys:
            new_lines.append(f"{key}={val}\n")

    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except PermissionError:
        raise HTTPException(status_code=500, detail=f"Permiso denegado para escribir .env en {env_path}. Ajusta owner/permisos de ese archivo.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo escribir .env ({env_path}): {e}")

    return {"ok": True, "message": "Configuracion actualizada. Reinicia radius-api para aplicar cambios."}


@router.get("/nas/test/{nas_id}", summary="Probar conectividad con NAS")
@router.get("/nas/test/{nas_id}/", include_in_schema=False)
def test_nas(nas_id: int):
    nas = query("SELECT * FROM nas WHERE id = %s", (nas_id,), fetchone=True)
    if not nas:
        raise HTTPException(status_code=404, detail="NAS no encontrado")

    result = _run_cmd(f"ping -c 2 -W 2 {nas['nasname']}")
    return {
        "nas": nas.get("shortname") or nas.get("nasname"),
        "ip": nas.get("nasname"),
        "reachable": result["code"] == 0,
        "output": result["output"],
    }


class OperatorCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str = "viewer"
    active: bool = True


class OperatorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None


@router.get("/operators", summary="Listar operadores")
@router.get("/operators/", include_in_schema=False)
def list_operators():
    _ensure_config_tables()
    return query(
        """
        SELECT id, username, full_name, email, role, active, last_login, created_at, updated_at
        FROM axio_gui_operators
        ORDER BY username ASC
        """
    )


@router.post("/operators", summary="Crear operador")
@router.post("/operators/", include_in_schema=False)
def create_operator(payload: OperatorCreate):
    _ensure_config_tables()
    exists = query("SELECT id FROM axio_gui_operators WHERE username = %s", (payload.username,), fetchone=True)
    if exists:
        raise HTTPException(status_code=409, detail="El operador ya existe")

    new_id = execute(
        """
        INSERT INTO axio_gui_operators (username, full_name, email, role, active)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (payload.username, payload.full_name, payload.email, payload.role, 1 if payload.active else 0),
    )
    return {"ok": True, "id": new_id}


@router.put("/operators/{operator_id}", summary="Actualizar operador")
@router.put("/operators/{operator_id}/", include_in_schema=False)
def update_operator(operator_id: int, payload: OperatorUpdate):
    _ensure_config_tables()
    row = query("SELECT id FROM axio_gui_operators WHERE id = %s", (operator_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Operador no encontrado")

    updates = []
    params = []
    if payload.full_name is not None:
        updates.append("full_name = %s")
        params.append(payload.full_name)
    if payload.email is not None:
        updates.append("email = %s")
        params.append(payload.email)
    if payload.role is not None:
        updates.append("role = %s")
        params.append(payload.role)
    if payload.active is not None:
        updates.append("active = %s")
        params.append(1 if payload.active else 0)

    if not updates:
        return {"ok": True, "message": "Sin cambios"}

    params.append(operator_id)
    execute(f"UPDATE axio_gui_operators SET {', '.join(updates)} WHERE id = %s", tuple(params))
    return {"ok": True}


@router.delete("/operators/{operator_id}", summary="Eliminar operador")
@router.delete("/operators/{operator_id}/", include_in_schema=False)
def delete_operator(operator_id: int):
    _ensure_config_tables()
    row = query("SELECT id FROM axio_gui_operators WHERE id = %s", (operator_id,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Operador no encontrado")

    execute("DELETE FROM axio_gui_operators WHERE id = %s", (operator_id,))
    return {"ok": True}


class BackupPolicyUpdate(BaseModel):
    enabled: bool
    frequency: str = Field(default="daily", min_length=4, max_length=20)
    retention_days: int = Field(default=14, ge=1, le=3650)
    backup_path: str = Field(default="/opt/radius-backups", min_length=3, max_length=255)


@router.get("/backup/status", summary="Estado de backup")
@router.get("/backup/status/", include_in_schema=False)
def backup_status():
    _ensure_config_tables()
    policy = query("SELECT * FROM axio_backup_policy WHERE id = 1", fetchone=True)
    jobs = query(
        """
        SELECT id, status, started_at, finished_at, notes, snapshot_json, created_at
        FROM axio_backup_jobs
        ORDER BY id DESC
        LIMIT 15
        """
    )

    table_counts = {
        "radcheck": int(query("SELECT COUNT(*) AS c FROM radcheck", fetchone=True)["c"]),
        "radacct": int(query("SELECT COUNT(*) AS c FROM radacct", fetchone=True)["c"]),
        "radpostauth": int(query("SELECT COUNT(*) AS c FROM radpostauth", fetchone=True)["c"]),
        "nas": int(query("SELECT COUNT(*) AS c FROM nas", fetchone=True)["c"]),
    }

    return {"policy": policy, "jobs": jobs, "table_counts": table_counts}


@router.put("/backup/policy", summary="Actualizar politica de backup")
@router.put("/backup/policy/", include_in_schema=False)
def update_backup_policy(payload: BackupPolicyUpdate):
    _ensure_config_tables()
    execute(
        """
        UPDATE axio_backup_policy
        SET enabled = %s,
            frequency = %s,
            retention_days = %s,
            backup_path = %s
        WHERE id = 1
        """,
        (1 if payload.enabled else 0, payload.frequency, payload.retention_days, payload.backup_path),
    )
    return {"ok": True}


@router.post("/backup/run", summary="Ejecutar backup logico")
@router.post("/backup/run/", include_in_schema=False)
def run_backup_now():
    _ensure_config_tables()
    started_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    snapshot = {
        "radcheck": int(query("SELECT COUNT(*) AS c FROM radcheck", fetchone=True)["c"]),
        "radacct": int(query("SELECT COUNT(*) AS c FROM radacct", fetchone=True)["c"]),
        "radpostauth": int(query("SELECT COUNT(*) AS c FROM radpostauth", fetchone=True)["c"]),
        "nas": int(query("SELECT COUNT(*) AS c FROM nas", fetchone=True)["c"]),
    }

    notes = "Snapshot logico generado desde API"
    snapshot_json = str(snapshot)

    job_id = execute(
        """
        INSERT INTO axio_backup_jobs (status, started_at, finished_at, notes, snapshot_json)
        VALUES (%s, %s, %s, %s, %s)
        """,
        ("success", started_at, started_at, notes, snapshot_json),
    )

    execute("UPDATE axio_backup_policy SET last_run = %s WHERE id = 1", (started_at,))

    return {"ok": True, "job_id": job_id, "snapshot": snapshot}


@router.get("/mail/settings", summary="Obtener configuracion SMTP")
@router.get("/mail/settings/", include_in_schema=False)
def mail_settings_get():
    _ensure_config_tables()
    row = query(
        """
        SELECT id, smtp_host, smtp_port, smtp_user, from_email, use_tls, use_ssl, updated_at
        FROM axio_mail_settings
        WHERE id = 1
        """,
        fetchone=True,
    )
    return row or {}


class MailSettingsUpdate(BaseModel):
    smtp_host: str = ""
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_user: str = ""
    smtp_password: Optional[str] = None
    from_email: str = ""
    use_tls: bool = True
    use_ssl: bool = False


@router.put("/mail/settings", summary="Guardar configuracion SMTP")
@router.put("/mail/settings/", include_in_schema=False)
def mail_settings_update(payload: MailSettingsUpdate):
    _ensure_config_tables()

    current = query("SELECT smtp_password FROM axio_mail_settings WHERE id = 1", fetchone=True)
    password_to_save = payload.smtp_password if payload.smtp_password not in (None, "") else (current["smtp_password"] if current else "")

    execute(
        """
        UPDATE axio_mail_settings
        SET smtp_host = %s,
            smtp_port = %s,
            smtp_user = %s,
            smtp_password = %s,
            from_email = %s,
            use_tls = %s,
            use_ssl = %s
        WHERE id = 1
        """,
        (
            payload.smtp_host,
            payload.smtp_port,
            payload.smtp_user,
            password_to_save,
            payload.from_email,
            1 if payload.use_tls else 0,
            1 if payload.use_ssl else 0,
        ),
    )

    return {"ok": True}


class MailTestRequest(BaseModel):
    recipient: Optional[str] = None


@router.post("/mail/test", summary="Probar conectividad SMTP")
@router.post("/mail/test/", include_in_schema=False)
def mail_test(payload: MailTestRequest):
    _ensure_config_tables()
    cfg = query("SELECT * FROM axio_mail_settings WHERE id = 1", fetchone=True)
    if not cfg or not cfg.get("smtp_host"):
        raise HTTPException(status_code=400, detail="SMTP host no configurado")

    try:
        if cfg.get("use_ssl"):
            server = smtplib.SMTP_SSL(cfg["smtp_host"], int(cfg["smtp_port"]), timeout=8)
        else:
            server = smtplib.SMTP(cfg["smtp_host"], int(cfg["smtp_port"]), timeout=8)
            if cfg.get("use_tls"):
                server.starttls()

        if cfg.get("smtp_user") and cfg.get("smtp_password"):
            server.login(cfg["smtp_user"], cfg["smtp_password"])

        if payload.recipient:
            msg = EmailMessage()
            msg["Subject"] = "Test SMTP AxioRadius"
            msg["From"] = cfg.get("from_email") or cfg.get("smtp_user") or "axioradius@localhost"
            msg["To"] = payload.recipient
            msg.set_content("Mensaje de prueba SMTP desde AxioRadius.")
            server.send_message(msg)

        server.noop()
        server.quit()
        return {"ok": True, "message": "SMTP conectado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo SMTP: {e}")


@router.get("/mail/templates", summary="Listar plantillas de correo")
@router.get("/mail/templates/", include_in_schema=False)
def mail_templates_list():
    _ensure_config_tables()
    return query("SELECT template_key, subject, body, updated_at FROM axio_mail_templates ORDER BY template_key")


class MailTemplateUpdate(BaseModel):
    subject: str = Field(min_length=3, max_length=180)
    body: str = Field(min_length=3)


@router.put("/mail/templates/{template_key}", summary="Actualizar plantilla de correo")
@router.put("/mail/templates/{template_key}/", include_in_schema=False)
def mail_template_update(template_key: str, payload: MailTemplateUpdate):
    _ensure_config_tables()
    row = query("SELECT template_key FROM axio_mail_templates WHERE template_key = %s", (template_key,), fetchone=True)
    if not row:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    execute(
        "UPDATE axio_mail_templates SET subject = %s, body = %s WHERE template_key = %s",
        (payload.subject, payload.body, template_key),
    )
    return {"ok": True}
