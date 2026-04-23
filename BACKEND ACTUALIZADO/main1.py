from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import (
    auth,
    users,
    groups,
    nas,
    sessions,
    logs,
    reports,
    batch,
    profiles,
    vouchers,
    config_routes,
    hotspots,
    user_groups,
    hunt_groups,
    attributes,
    realm_proxy,
    ip_pool,
    accounting,
)



app = FastAPI(
    title="RADIUS Manager API",
    description="Backend para gestión de FreeRADIUS — usuarios, NAS, sesiones y reportes.",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
        
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Ajusta los origins según donde esté tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rutas ──────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(nas.router)
app.include_router(sessions.router)
app.include_router(logs.router)
app.include_router(reports.router)
app.include_router(batch.router)
app.include_router(profiles.router)
app.include_router(vouchers.router)
app.include_router(config_routes.router)
app.include_router(hotspots.router)
app.include_router(user_groups.router)
app.include_router(hunt_groups.router)
app.include_router(attributes.router)
app.include_router(realm_proxy.router)
app.include_router(ip_pool.router)
app.include_router(accounting.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "RADIUS Manager API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
def health():
    """Endpoint para verificar que el servicio está vivo."""
    from core.database import query
    try:
        query("SELECT 1", fetchone=True)
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {e}"
    return {"status": "ok", "database": db_status}
