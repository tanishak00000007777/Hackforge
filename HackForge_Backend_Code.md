# HackForge Backend — Complete Code Documentation
> Python FastAPI + Supabase PostgreSQL
> Everything built in today's session, phase by phase.

---

## Project Folder Structure

```
hackforge/
└── backend/
    ├── alembic/
    │   ├── versions/
    │   │   └── 6fab80cbbd75_create_users_table.py   ← auto-generated migration
    │   ├── env.py                                    ← alembic configuration
    │   └── script.py.mako                            ← migration template
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                                   ← FastAPI entry point
    │   ├── config/
    │   │   ├── __init__.py
    │   │   └── settings.py                           ← env vars
    │   ├── core/
    │   │   ├── __init__.py
    │   │   ├── database.py                           ← DB engine + session
    │   │   ├── dependencies.py                       ← JWT auth dependency
    │   │   └── security.py                           ← JWT create/decode
    │   ├── models/
    │   │   ├── __init__.py                           ← imports all models
    │   │   ├── base_model.py                         ← shared id, created_at, updated_at
    │   │   └── user.py                               ← User table
    │   ├── schemas/
    │   │   ├── __init__.py
    │   │   └── user.py                               ← pydantic request/response
    │   ├── routers/
    │   │   ├── __init__.py                           ← imports all routers
    │   │   ├── auth.py                               ← /auth/register, /auth/login
    │   │   ├── users.py
    │   │   ├── organizations.py
    │   │   ├── hackathons.py
    │   │   ├── tracks.py
    │   │   ├── registrations.py
    │   │   ├── teams.py
    │   │   ├── submissions.py
    │   │   ├── judges.py
    │   │   ├── scores.py
    │   │   ├── leaderboard.py
    │   │   ├── certificates.py
    │   │   ├── announcements.py
    │   │   ├── sponsors.py
    │   │   └── analytics.py
    │   ├── services/
    │   │   ├── __init__.py
    │   │   └── auth_service.py                       ← register + login logic
    │   ├── middleware/
    │   │   └── __init__.py
    │   └── utils/
    │       ├── __init__.py
    │       └── hashing.py                            ← bcrypt password hashing
    ├── venv/
    ├── .env                                          ← secret, never commit
    ├── .env.example
    ├── alembic.ini
    ├── requirements.txt
    └── requirements-dev.txt
```

---

## Phase 1 — FastAPI Setup

### `requirements.txt`
```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.1
python-dotenv==1.0.1
pydantic==2.7.1
pydantic-settings==2.2.1
email-validator==2.2.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==3.2.2
python-multipart==0.0.9
httpx==0.27.0
supabase==2.5.0
```

### `requirements-dev.txt`
```txt
-r requirements.txt
pytest==8.3.2
pytest-asyncio==0.23.6
```

> **Why asyncpg not psycopg2?**
> We use async SQLAlchemy. psycopg2 is synchronous and will conflict with AsyncSession.
> asyncpg is the async PostgreSQL driver.

> **Why bcrypt==3.2.2 not 4.x?**
> passlib 1.7.4 breaks with bcrypt >= 4.0.0 due to an internal API change.

---

## Phase 2 — Supabase Connection

### `.env`
```env
APP_NAME=HackForge
APP_VERSION=0.1.0
DEBUG=True
SECRET_KEY=your-super-secret-key-change-this-in-production

# Get this from Supabase → Connect button → URI
# IMPORTANT: change postgresql:// to postgresql+asyncpg://
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# From Supabase → Settings → API Keys
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **Never commit `.env` to GitHub.**
> Always commit `.env.example` with empty values.

### `app/config/settings.py`
```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "HackForge"
    app_version: str = "0.1.0"
    debug: bool = False
    secret_key: str

    database_url: str

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    allowed_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

> **Why `@lru_cache()`?**
> Without it, `.env` is read on every single request.
> With it, `.env` is read once when the app starts and cached in memory.

### `app/core/database.py`
```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.config.settings import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=True,          # logs SQL queries — set False in production
    future=True,
    pool_pre_ping=True, # checks connection health before using it
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

> **Why commit/rollback in get_db?**
> If a route throws an error mid-transaction, rollback cleans up dirty data automatically.
> Without this, failed requests can leave partial data in the session.

---

## Phase 3 — Base Model

### `app/models/base_model.py`
```python
import uuid
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base


class BaseModel(Base):
    """
    Abstract base — never creates its own table.
    Every model inherits from this instead of Base directly.
    Gives every table: id, created_at, updated_at for free.
    """
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
```

> **Why `__abstract__ = True`?**
> Tells SQLAlchemy this class itself is not a table.
> Only its children create actual tables in the database.

> **Every future model follows this pattern:**
> ```python
> class Hackathon(BaseModel):
>     __tablename__ = "hackathons"
>     # id, created_at, updated_at are inherited automatically
>     title: Mapped[str] = mapped_column(String(255), nullable=False)
> ```

### `app/models/__init__.py`
```python
from app.models.base_model import BaseModel
from app.models.user import User
# add every new model here as you create it
```

> **Why import models here?**
> Alembic discovers tables through `Base.metadata`.
> If a model is not imported, Alembic cannot see it and will not migrate it.

---

## Phase 4 — Authentication

### `app/models/user.py`
```python
import enum
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base_model import BaseModel


class UserRole(str, enum.Enum):
    organizer = "organizer"
    participant = "participant"
    judge = "judge"
    admin = "admin"


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole), nullable=False, default=UserRole.participant
    )
    org_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
```

> **Columns inherited from BaseModel:** `id`, `created_at`, `updated_at`
> **Why index=True on email?** Every login query searches by email. Index makes it fast.
> **Why store hashed_password not password?** Plain text passwords are never stored. Ever.

---

### `app/schemas/user.py`
```python
import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    organizer = "organizer"
    participant = "participant"
    judge = "judge"
    admin = "admin"


class UserCreate(BaseModel):
    """What the API accepts when registering a new user"""
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.participant
    org_name: str | None = None


class UserLogin(BaseModel):
    """What the API accepts when logging in"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """What the API returns — never includes hashed_password"""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    org_name: str | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Returned after successful login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

> **Models vs Schemas — the key difference:**
> - `models/user.py` = how the data is stored in the database (SQLAlchemy)
> - `schemas/user.py` = what the API accepts and returns (Pydantic)
> - `UserResponse` never includes `hashed_password` — security by design

---

### `app/utils/hashing.py`
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

> **How bcrypt works:**
> `hash_password("password123")` → `$2b$12$randomsaltXXXXXXhashedvalue`
> Every time you hash the same password, the result is different (random salt).
> `verify_password` handles the comparison correctly despite different hashes.

---

### `app/core/security.py`
```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config.settings import get_settings

settings = get_settings()


def create_access_token(subject: str | int) -> str:
    """
    subject = user ID (UUID as string)
    Expires in ACCESS_TOKEN_EXPIRE_MINUTES (default 60 mins)
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str | int) -> str:
    """
    Expires in REFRESH_TOKEN_EXPIRE_DAYS (default 7 days)
    Used to get a new access token without logging in again
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    payload = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """
    Raises JWTError if token is invalid or expired.
    Returns the payload dict with 'sub' = user ID
    """
    return jwt.decode(
        token, settings.secret_key, algorithms=[settings.jwt_algorithm]
    )
```

> **Why two tokens?**
> - `access_token` expires in 60 mins — used for every API call
> - `refresh_token` expires in 7 days — used only to get a new access token
> This way if an access token is stolen, it expires quickly.

---

### `app/core/dependencies.py`
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.core.security import decode_token

bearer_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    """
    Reads the Bearer token from Authorization header.
    Decodes it and returns the user ID.
    Used as: user_id: int = Depends(get_current_user_id)
    Will be upgraded to return full User object in Phase 5.
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return int(user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

---

### `app/services/auth_service.py`
```python
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token, create_refresh_token


async def register_user(user_data: UserCreate, db: AsyncSession) -> User:
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        org_name=user_data.org_name,
    )

    db.add(new_user)
    await db.flush()        # sends INSERT, gets id back, stays in transaction
    await db.refresh(new_user)  # reloads from DB to get server-set values
    return new_user


async def login_user(login_data: UserLogin, db: AsyncSession) -> TokenResponse:
    result = await db.execute(
        select(User).where(User.email == login_data.email)
    )
    user = result.scalar_one_or_none()

    # Same error for wrong email and wrong password — security best practice
    # Never tell the user which one was wrong
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
```

> **Why same error message for wrong email and wrong password?**
> If you say "email not found" the attacker knows which emails exist in your system.
> Always return the same message for both cases.

---

### `app/routers/auth.py`
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    return await register_user(user_data, db)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    return await login_user(login_data, db)
```

> **Router rule:** Routers never touch the database directly.
> Router calls service. Service calls DB. Always.

---

### `app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.routers import (
    auth, users, organizations, hackathons, tracks,
    registrations, teams, submissions, judges, scores,
    leaderboard, certificates, announcements, sponsors, analytics,
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="HackForge — Customizable Hackathon Hosting SaaS",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(auth.router,          prefix=API_PREFIX)
app.include_router(users.router,         prefix=API_PREFIX)
app.include_router(organizations.router, prefix=API_PREFIX)
app.include_router(hackathons.router,    prefix=API_PREFIX)
app.include_router(tracks.router,        prefix=API_PREFIX)
app.include_router(registrations.router, prefix=API_PREFIX)
app.include_router(teams.router,         prefix=API_PREFIX)
app.include_router(submissions.router,   prefix=API_PREFIX)
app.include_router(judges.router,        prefix=API_PREFIX)
app.include_router(scores.router,        prefix=API_PREFIX)
app.include_router(leaderboard.router,   prefix=API_PREFIX)
app.include_router(certificates.router,  prefix=API_PREFIX)
app.include_router(announcements.router, prefix=API_PREFIX)
app.include_router(sponsors.router,      prefix=API_PREFIX)
app.include_router(analytics.router,     prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.app_version}
```

---

## Alembic Configuration

### `alembic.ini` (key section)
```ini
[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = driver://user:pass@localhost/dbname
```

> The `sqlalchemy.url` here is overridden by `env.py` at runtime.
> The value here does not matter.

### `alembic/env.py`
```python
import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.database import Base
from app.models.user import User
from app.config.settings import get_settings

settings = get_settings()

config = context.config

# % in passwords breaks configparser — replace with %%
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

> **Why `.replace("%", "%%")`?**
> Supabase passwords can contain special characters like `@` which get URL-encoded as `%40`.
> Python's configparser chokes on `%` — doubling it to `%%` escapes it correctly.

---

## Alembic Commands Reference

```bash
# Generate a new migration after changing a model
alembic revision --autogenerate -m "description_of_change"

# Apply all pending migrations to the database
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# See current migration version
alembic current

# See migration history
alembic history
```

---

## API Endpoints Built

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | `/health` | Health check | No |
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login, get tokens | No |

**Swagger UI:** `http://127.0.0.1:8000/docs`
**ReDoc:** `http://127.0.0.1:8000/redoc`

---

## How to Run

```bash
cd backend
source venv/bin/activate      # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

---

## Phase Completion Status

| Phase | What was built | Status |
|-------|---------------|--------|
| Phase 1 | FastAPI project setup, folder structure, all 15 empty routers | ✅ Done |
| Phase 2 | Supabase PostgreSQL connection via asyncpg | ✅ Done |
| Phase 3 | Abstract BaseModel with id, created_at, updated_at | ✅ Done |
| Phase 4 | User model, schemas, hashing, JWT, register, login | ✅ Done |
| Phase 5 | Organization model | 🔜 Next |
| Phase 6 | Hackathon model | 🔜 Upcoming |
| Phase 7 | Registration system | 🔜 Upcoming |
| Phase 8 | Submission system | 🔜 Upcoming |
| Phase 9 | Judging system | 🔜 Upcoming |
| Phase 10 | Leaderboard | 🔜 Upcoming |

---

## Key Rules for the Team

1. **Routers never touch the database directly** — router calls service, service calls DB
2. **Never store plain text passwords** — always hash before saving
3. **Never expose `hashed_password` in responses** — use `UserResponse` schema
4. **Never commit `.env`** — only commit `.env.example`
5. **Every new model must be imported in `models/__init__.py`** — or Alembic won't see it
6. **Run migration after every model change** — `alembic revision --autogenerate -m "description"`
7. **Same error message for wrong email and wrong password** — security best practice
