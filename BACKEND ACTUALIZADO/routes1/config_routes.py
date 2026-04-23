import subprocess
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.database import query, execute
from core.security import verify_token
from core.config import settings

router = APIRouter(prefix="/api/config", tags=["Configuración"], dependencies=[Depends(verify_token)])


def _run_cmd(cmd: str) -> dict:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return {"output": result.stdout.strip(), "error": result.stderr.strip(), "code": result.returncode}
    except Exception as e:
        return {"output": "", "error": str(e), "code": -1}


@router.get("/server", summary="Información del servidor")
@router.get("/server/", include_in_schema=False)
def server_info():
    """Retorna información del sistema y estado de servicios."""

    # Info del sistema
    hostname   = _run_cmd("hostname")["output"]
    uptime     = _run_cmd("uptime -p")["output"]
    os_info    = _run_cmd("lsb_release -d | cut -f2")["output"]
    cpu_usage  = _run_cmd("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'")["output"]
    mem        = _run_cmd("free -m | awk 'NR==2{printf \"%s/%s MB (%.1f%%)\", $3,$2,$3*100/$2}'")["output"]
    disk       = _run_cmd("df -h / | awk 'NR==2{print $3\"/\"$2\" (\"$5\")\"}'")["output"]
    ip_addr    = _run_cmd("hostname -I | awk '{print $1}'")["output"]

    # Estado de servicios
    def service_status(name):
        r = _run_cmd(f"systemctl is-active {name}")
        return r["output"] == "active"

    freeradius_ok = service_status("freeradius")
    mariadb_ok    = service_status("mariadb") or service_status("mysql")
    apache_ok     = service_status("apache2")
    radiusapi_ok  = service_status("radius-api")

    # Stats de BD
    db_users    = query("SELECT COUNT(*) as total FROM radcheck WHERE attribute='Cleartext-Password'", fetchone=True)
    db_nas      = query("SELECT COUNT(*) as total FROM nas", fetchone=True)
    db_sessions = query("SELECT COUNT(*) as total FROM radacct WHERE acctstoptime IS NULL", fetchone=True)
    db_vouchers = query("SELECT COUNT(*) as total FROM radcheck WHERE username LIKE 'VCH-%%' AND attribute='Cleartext-Password'", fetchone=True)

    return {
        "system": {
            "hostname":  hostname,
            "os":        os_info,
            "uptime":    uptime,
            "ip":        ip_addr,
            "cpu_usage": cpu_usage + "%" if cpu_usage else "—",
            "memory":    mem,
            "disk":      disk,
        },
        "services": {
            "freeradius": freeradius_ok,
            "mariadb":    mariadb_ok,
            "apache":     apache_ok,
            "radius_api": radiusapi_ok,
        },
        "database": {
            "users":    db_users["total"] if db_users else 0,
            "nas":      db_nas["total"] if db_nas else 0,
            "sessions": db_sessions["total"] if db_sessions else 0,
            "vouchers": db_vouchers["total"] if db_vouchers else 0,
        }
    }


@router.post("/services/{service}/restart", summary="Reiniciar servicio")
@router.post("/services/{service}/restart/", include_in_schema=False)
def restart_service(service: str):
    allowed = ["freeradius", "apache2", "mariadb", "radius-api"]
    if service not in allowed:
        raise HTTPException(status_code=400, detail=f"Servicio no permitido. Permitidos: {allowed}")

    result = _run_cmd(f"systemctl restart {service}")
    if result["code"] != 0:
        raise HTTPException(status_code=500, detail=result["error"])

    return {"ok": True, "service": service, "action": "restarted"}


@router.get("/freeradius/log", summary="Últimas líneas del log de FreeRADIUS")
@router.get("/freeradius/log/", include_in_schema=False)
def freeradius_log(lines: int = 50):
    result = _run_cmd(f"tail -n {lines} /var/log/freeradius/radius.log")
    return {"lines": result["output"].split("\n") if result["output"] else []}


@router.get("/gui", summary="Configuración actual del panel")
@router.get("/gui/", include_in_schema=False)
def get_gui_config():
    """Retorna la configuración actual del panel (sin contraseña)."""
    return {
        "admin_user":    settings.GUI_ADMIN_USER,
        "db_host":       settings.DB_HOST,
        "db_port":       settings.DB_PORT,
        "db_name":       settings.DB_NAME,
        "db_user":       settings.DB_USER,
        "api_port":      8080,
        "token_expire":  settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    }


class GuiConfigUpdate(BaseModel):
    admin_user:     Optional[str] = None
    admin_password: Optional[str] = None
    token_expire:   Optional[int] = None


@router.put("/gui", summary="Actualizar configuración del panel")
@router.put("/gui/", include_in_schema=False)
def update_gui_config(data: GuiConfigUpdate):
    """Actualiza el archivo .env con nuevos valores."""
    env_path = "/opt/radius-backend/.env"

    if not os.path.exists(env_path):
        raise HTTPException(status_code=404, detail="Archivo .env no encontrado")

    with open(env_path, "r") as f:
        lines = f.readlines()

    updates = {}
    if data.admin_user:     updates["GUI_ADMIN_USER"] = data.admin_user
    if data.admin_password: updates["GUI_ADMIN_PASSWORD"] = data.admin_password
    if data.token_expire:   updates["ACCESS_TOKEN_EXPIRE_MINUTES"] = str(data.token_expire)

    new_lines = []
    for line in lines:
        updated = False
        for key, val in updates.items():
            if line.startswith(f"{key}="):
                new_lines.append(f"{key}={val}\n")
                updated = True
                break
        if not updated:
            new_lines.append(line)

    with open(env_path, "w") as f:
        f.writelines(new_lines)

    return {"ok": True, "message": "Configuración actualizada. Reinicia el servicio para aplicar cambios."}


@router.get("/nas/test/{nas_id}", summary="Probar conectividad con NAS")
@router.get("/nas/test/{nas_id}/", include_in_schema=False)
def test_nas(nas_id: int):
    nas = query("SELECT * FROM nas WHERE id = %s", (nas_id,), fetchone=True)
    if not nas:
        raise HTTPException(status_code=404, detail="NAS no encontrado")

    result = _run_cmd(f"ping -c 2 -W 2 {nas['nasname']}")
    reachable = result["code"] == 0

    return {
        "nas":       nas["shortname"],
        "ip":        nas["nasname"],
        "reachable": reachable,
        "output":    result["output"],
    }
