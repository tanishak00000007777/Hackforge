# HackForge Project Context

This repository is the backend API for HackForge. It is a FastAPI application backed by PostgreSQL through SQLAlchemy async sessions and Alembic migrations.

## Architecture

```text
Frontend -> HTTP JSON -> FastAPI -> SQLAlchemy -> PostgreSQL
```

## Current Database Position

- The project is PostgreSQL-only.
- `DATABASE_URL` is the only database connection setting used by the app.
- There is no active third-party database SDK integration in the codebase.

## Important Files

- `app/main.py`: FastAPI app and router registration.
- `app/config/settings.py`: loads environment variables.
- `app/core/database.py`: async engine, session factory, and `get_db()`.
- `alembic/env.py`: wires Alembic to the app database settings.
- `app/models/`: SQLAlchemy models.
- `app/schemas/`: Pydantic request and response models.
- `app/services/`: business logic.
- `app/routers/`: API endpoints.

## Environment

Required values:

```env
SECRET_KEY=your-secret
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/hackforge
```

Optional values:

```env
APP_NAME=HackForge
APP_VERSION=0.1.0
DEBUG=True
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Migration Workflow

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
alembic downgrade -1
```

Alembic uses the value of `settings.database_url` from `app/config/settings.py`.

## Cleanup Summary

The old provider-specific references in repository documentation were removed so the docs now match the actual backend implementation: plain PostgreSQL via `asyncpg`.
