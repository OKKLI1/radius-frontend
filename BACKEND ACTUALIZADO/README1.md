# RADIUS Manager — Backend (FastAPI)

Backend completo para gestionar FreeRADIUS via API REST.

## Estructura del proyecto

```
radius-backend/
├── main.py                  # Entrada principal FastAPI
├── requirements.txt         # Dependencias Python
├── .env.example             # Variables de entorno (copiar a .env)
├── radius-api.service       # Servicio systemd para producción
├── core/
│   ├── config.py            # Settings (lee el .env)
│   ├── database.py          # Pool de conexiones MySQL
│   └── security.py          # JWT utilities
└── routes/
    ├── auth.py              # POST /api/auth/login
    ├── users.py             # CRUD /api/users
    ├── groups.py            # CRUD /api/groups
    ├── nas.py               # CRUD /api/nas
    ├── sessions.py          # GET  /api/sessions/active|history
    ├── logs.py              # GET  /api/logs/auth
    └── reports.py           # GET  /api/reports/dashboard|traffic|top-users
```

## Instalación en Ubuntu Server

### 1. Instalar dependencias del sistema
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv -y
```

### 2. Copiar el proyecto al servidor
```bash
sudo mkdir -p /opt/radius-backend
sudo cp -r . /opt/radius-backend/
cd /opt/radius-backend
```

### 3. Crear entorno virtual e instalar dependencias
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
nano .env
# Edita DB_PASSWORD y SECRET_KEY
```

### 5. Probar en desarrollo
```bash
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Abre: http://IP-SERVIDOR:8080/docs

### 6. Instalar como servicio systemd (producción)
```bash
sudo cp radius-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable radius-api
sudo systemctl start radius-api
sudo systemctl status radius-api
```

## Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login → retorna JWT |
| GET | /api/users | Listar usuarios |
| POST | /api/users | Crear usuario |
| PUT | /api/users/{username} | Actualizar usuario |
| DELETE | /api/users/{username} | Eliminar usuario |
| POST | /api/users/{username}/disable | Bloquear usuario |
| POST | /api/users/{username}/enable | Desbloquear usuario |
| GET | /api/groups | Listar grupos |
| POST | /api/groups | Crear grupo |
| DELETE | /api/groups/{groupname} | Eliminar grupo |
| GET | /api/nas | Listar clientes NAS |
| POST | /api/nas | Agregar NAS |
| PUT | /api/nas/{id} | Actualizar NAS |
| DELETE | /api/nas/{id} | Eliminar NAS |
| GET | /api/sessions/active | Sesiones activas |
| GET | /api/sessions/history | Historial de sesiones |
| DELETE | /api/sessions/active/{id} | Desconectar sesión |
| GET | /api/logs/auth | Logs de autenticación |
| GET | /api/logs/auth/stats | Estadísticas de auth |
| GET | /api/reports/dashboard | Stats para dashboard |
| GET | /api/reports/traffic/daily | Tráfico por día |
| GET | /api/reports/top-users | Top usuarios por datos |
| GET | /api/reports/by-nas | Tráfico por NAS |
| GET | /health | Estado del servicio |

## Uso básico (curl)

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -d "username=admin&password=admin123" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Listar usuarios
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/users

# 3. Crear usuario
curl -X POST http://localhost:8080/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"jlopez","password":"clave123","group":"empleados"}'

# 4. Sesiones activas
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/sessions/active
```
"# RADIUS-BACKEND" 
