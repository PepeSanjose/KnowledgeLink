# Backend FastAPI – Guía de arranque (KM-MVP)

Esta guía explica cómo poner en marcha el backend (FastAPI + SQLAlchemy + Alembic + JWT) de forma rápida en entorno local (PoC con SQLite). El frontend (React/Vite) del repo puede usarse en paralelo, pero aquí nos centramos en el backend.

## Requisitos
- Python 3.11 (recomendado) con `pip`
- (Opcional) PostgreSQL 14+ si quieres probar con Postgres en vez de SQLite
- Windows PowerShell o CMD (comandos equivalentes para macOS/Linux incluidos más abajo)

## Estructura relevante
```
backend/
├─ app/
│  ├─ core/
│  │  ├─ config.py           # Settings (.env) con pydantic-settings
│  │  ├─ security.py         # JWT + hash de contraseñas
│  │  └─ logging.py          # logging estructurado JSON
│  ├─ db/
│  │  ├─ base.py             # SQLAlchemy Declarative Base
│  │  └─ session.py          # engine + SessionLocal + get_db()
│  ├─ api/
│  │  ├─ deps.py             # dependencias comunes
│  │  ├─ routes/
│  │  │  ├─ auth.py          # POST /api/v1/auth/login (stub JWT)
│  │  │  ├─ users.py         # stubs
│  │  │  ├─ projects.py      # stubs
│  │  │  ├─ teams.py         # stubs
│  │  │  └─ positions.py     # stubs
│  │  └─ api_v1.py           # router /api/v1 + /health
│  └─ main.py                # FastAPI app (incluye CORS y logging)
├─ alembic/
│  ├─ env.py                 # lee DATABASE_URL de Settings si no está en alembic.ini
│  └─ versions/              # migraciones
├─ .env.example              # variables de entorno de ejemplo
├─ requirements.txt          # dependencias backend
└─ tests/
   ├─ conftest.py
   └─ test_health.py
```

## 1) Crear entorno virtual e instalar dependencias (Windows)
```
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip wheel
.\.venv\Scripts\pip install -r requirements.txt
```
macOS/Linux:
```
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip wheel
pip install -r requirements.txt
```

## 2) Configurar variables (.env)
Copia el ejemplo y ajusta si lo necesitas:
```
cd backend
copy .env.example .env     # Windows
# macOS/Linux: cp .env.example .env
```
Variables principales (en `backend/.env`):
```
APP_NAME="km-mvp"
APP_ENV="dev"
LOG_LEVEL="INFO"
# PoC por defecto con SQLite (no requiere instalar BBDD)
DATABASE_URL="sqlite:///./app.db"
# Para Postgres, por ejemplo:
# DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/km"

JWT_SECRET="cambia_esto_por_un_secreto_fuerte"
JWT_ALG="HS256"
JWT_EXPIRES_MIN=15
REFRESH_EXPIRES_MIN=43200

# CORS (CSV o JSON list)
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

## 3) (Opcional) Migraciones con Alembic
El proyecto ya incluye `alembic.ini` y `backend/alembic/env.py`. Cuando añadas modelos reales:
```
# Generar una versión a partir de tus modelos
alembic revision --autogenerate -m "init"
# Aplicar migraciones
alembic upgrade head
```
Notas:
- Si `alembic.ini` no tiene `sqlalchemy.url`, se usará `DATABASE_URL` del `.env`.
- En SQLite, `render_as_batch` está activado para compatibilidad con alteraciones.

## 4) Arrancar la API
Desde la raíz del repo (o dentro de `backend/`), lanza Uvicorn con el venv:
```
cd backend && .\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
macOS/Linux:
```
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

## 5) Endpoints de prueba
- Salud:
  - GET http://localhost:8000/api/v1/health → `{"status":"ok"}`
- Hola mundo (compatibilidad):
  - GET http://localhost:8000/ → `{"message":"Hola mundo"}`

Ejemplos (Windows PowerShell o Git Bash con curl):
```
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/
```

## 6) Autenticación (stub) y rutas protegidas
Login de prueba (stub): emite un JWT válido sin comprobar credenciales reales todavía.
```
curl -X POST http://localhost:8000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@example.com\",\"password\":\"demo\"}"
```
Respuesta:
```
{"access_token":"<JWT>","token_type":"bearer"}
```
Usar el token en rutas protegidas, por ejemplo `GET /api/v1/users`:
```
curl http://localhost:8000/api/v1/users -H "Authorization: Bearer <JWT>"
```
Nota: por ahora las rutas de users/projects/teams/positions son stubs y devuelven datos vacíos/ejemplo. Más adelante se conectarán a repositorios/servicios y DB real.

## 7) CORS y logging
- CORS se configura desde `CORS_ORIGINS` en `.env` (CSV o lista JSON).
- Logging sale por consola en formato JSON (niveles controlados por `LOG_LEVEL`).

## 8) Ejecutar tests
Desde la raíz del repo:
```
cd backend && .\.venv\Scripts\pytest -q
```
macOS/Linux:
```
cd backend
source .venv/bin/activate
pytest -q
```
Incluye pruebas básicas de salud (`/api/v1/health`) y del endpoint raíz.

## 9) Pasar de SQLite a PostgreSQL (cuando quieras)
1. Instala y levanta PostgreSQL localmente (puerto 5432 por defecto).
2. Define `DATABASE_URL` en `.env`, p.ej.:
   ```
   DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/km"
   ```
3. Genera y aplica migraciones con Alembic:
   ```
   alembic revision --autogenerate -m "init"
   alembic upgrade head
   ```
4. Reinicia la API.

## 10) Problemas comunes
- `ModuleNotFoundError: pydantic_settings`: asegúrate de haber instalado requerimientos dentro del venv (`pip install -r requirements.txt`).
- Puerto en uso: cambia `--port` en el comando de Uvicorn.
- Variables `.env`: confirma que `backend/.env` existe y que usas rutas relativas correctas (el loader busca `.env` en `backend/`).

---

## Frontend (resumen rápido)
Si deseas levantar el frontend incluido (opcional para esta guía):
```
cd frontend
npm install
npm run dev
```
Vite por defecto en: http://localhost:5173. Si el backend no está en 8000, crea `frontend/.env` con:
```
VITE_API_URL=http://localhost:8001
