# HackForge Backend — Complete Code Reference
> Every single file written for this project, in order.
> Read this top to bottom and you will understand the entire backend.

---

## How to Read This File

```
Each section = one file in the project
Each file has:
  1. The file path
  2. What it does in one line
  3. The complete code
  4. Notes explaining the important parts
```

The order follows how data flows through the system:
```
Config → Database → Security → Models → Schemas → Services → Routers → Main
```

---

## 1. SETUP FILES

---

### `requirements.txt`
> All Python packages needed to run the project

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

> `asyncpg` not `psycopg2` — we use async SQLAlchemy, psycopg2 is sync and will break it
> `bcrypt==3.2.2` not 4.x — passlib breaks with bcrypt 4.0+

---

### `requirements-dev.txt`
> Extra packages for testing only — not installed in production

```txt
-r requirements.txt
pytest==8.3.2
pytest-asyncio==0.23.6
```

---

### `.env.example`
> Template for the .env file — commit this, never commit the actual .env

```env
APP_NAME=HackForge
APP_VERSION=0.1.0
DEBUG=True
SECRET_KEY=your-super-secret-key-change-this-in-production

# From Supabase → Connect button → URI tab
# Change postgresql:// to postgresql+asyncpg://
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## 2. CONFIG

---

### `app/config/settings.py`
> Reads the .env file once when the app starts and exposes typed settings

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

> `@lru_cache()` — reads .env only once on startup, not on every request
> Import pattern everywhere: `from app.config.settings import get_settings`

---

## 3. CORE

---

### `app/core/database.py`
> Creates the async database engine, session factory, and Base class

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

# Creates the connection pool to Supabase
engine = create_async_engine(
    settings.database_url,
    echo=True,           # logs every SQL query — set False in production
    future=True,
    pool_pre_ping=True,  # tests connection health before using it
)

# Session factory — creates a new session for each request
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# Every model inherits from this Base
class Base(DeclarativeBase):
    pass


# FastAPI dependency — injects a DB session into any route that needs it
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()    # auto-commit on success
        except Exception:
            await session.rollback()  # auto-rollback on any error
            raise
        finally:
            await session.close()
```

> `get_db()` is used like this in every route:
> `db: AsyncSession = Depends(get_db)`

---

### `app/core/security.py`
> Creates and decodes JWT tokens for authentication

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config.settings import get_settings

settings = get_settings()


def create_access_token(subject: str | int) -> str:
    """
    Creates a short-lived token (60 mins by default).
    subject = user UUID as string.
    Used for every API call.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str | int) -> str:
    """
    Creates a long-lived token (7 days by default).
    Used only to get a new access token when it expires.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    payload = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """
    Decodes and verifies a JWT token.
    Raises JWTError if token is invalid or expired.
    Returns the payload dict — payload["sub"] = user UUID
    """
    return jwt.decode(
        token, settings.secret_key, algorithms=[settings.jwt_algorithm]
    )
```

---

### `app/core/dependencies.py`
> `get_current_user()` — the most used function in the entire project

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import decode_token
from app.core.database import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Reads the Bearer token from Authorization header.
    Decodes it → gets user UUID → fetches full User from DB → returns it.

    Usage in any protected route:
        current_user = Depends(get_current_user)

    Returns the full User object so routes know who is making the request.
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.models.user import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return user
```

---

## 4. MODELS
> SQLAlchemy ORM classes — each one maps to a table in Supabase

---

### `app/models/base_model.py`
> Parent class for all models — gives every table id, created_at, updated_at for free

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
    __abstract__ = True means this class itself never creates a table.
    Every model inherits from BaseModel instead of Base directly.
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

---

### `app/models/__init__.py`
> CRITICAL — Alembic finds tables through Base.metadata. If a model is not imported here, its table will not be created.

```python
from app.models.base_model import BaseModel
from app.models.user import User
from app.models.organization import Organization
from app.models.hackathon import Hackathon
from app.models.registration import Registration
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.submission import Submission
from app.models.judge import Judge
from app.models.rubric_criteria import RubricCriteria
from app.models.score import Score
from app.models.track import Track
from app.models.certificate import Certificate
from app.models.announcement import Announcement
```

---

### `app/models/user.py`
> users table — every person on the platform

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
        # index=True because every login queries by email — makes it fast
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

---

### `app/models/organization.py`
> organizations table — the college or company that owns hackathons

```python
import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    owner: Mapped["User"] = relationship("User", back_populates="organizations")
    hackathons: Mapped[list["Hackathon"]] = relationship("Hackathon", back_populates="organization")
```

---

### `app/models/hackathon.py`
> hackathons table — the core event entity

```python
import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class HackathonMode(str, enum.Enum):
    online = "online"
    offline = "offline"
    hybrid = "hybrid"


class HackathonStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    ongoing = "ongoing"
    ended = "ended"


class RegistrationMode(str, enum.Enum):
    open = "open"        # auto-approved on registration
    approval = "approval"  # organizer manually approves


class Hackathon(BaseModel):
    __tablename__ = "hackathons"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    mode: Mapped[HackathonMode] = mapped_column(SAEnum(HackathonMode), default=HackathonMode.online)
    status: Mapped[HackathonStatus] = mapped_column(SAEnum(HackathonStatus), default=HackathonStatus.draft)
    start_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_open: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_close: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_deadline: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    venue: Mapped[str | None] = mapped_column(String(500), nullable=True)
    max_participants: Mapped[int] = mapped_column(Integer, default=200)
    max_team_size: Mapped[int] = mapped_column(Integer, default=4)
    min_team_size: Mapped[int] = mapped_column(Integer, default=1)
    registration_mode: Mapped[RegistrationMode] = mapped_column(SAEnum(RegistrationMode), default=RegistrationMode.open)
    website_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    # website_config stores: template, colors, fonts, section toggles, custom content
    # Example: {"template": "modern", "primary_color": "#6366f1", "sections": {"hero": true, "faq": false}}
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    prize_pool: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="hackathons")
    creator: Mapped["User"] = relationship("User")
```

---

### `app/models/registration.py`
> registrations table — who registered for which hackathon

```python
import enum
import uuid
from sqlalchemy import ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class RegistrationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    waitlisted = "waitlisted"


class Registration(BaseModel):
    __tablename__ = "registrations"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        SAEnum(RegistrationStatus), default=RegistrationStatus.pending, nullable=False
    )
    form_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    # form_data stores custom registration fields answers as JSON

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")
```

---

### `app/models/team.py`
> teams table — a team within a hackathon

```python
import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class Team(BaseModel):
    __tablename__ = "teams"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    # invite_code is auto-generated — 8 chars uppercase, e.g. "X7K2PQ9R"
    leader_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    leader: Mapped["User"] = relationship("User", foreign_keys=[leader_id])
    members: Mapped[list["TeamMember"]] = relationship("TeamMember", back_populates="team")
```

---

### `app/models/team_member.py`
> team_members table — join table between teams and users

```python
import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class TeamMember(BaseModel):
    __tablename__ = "team_members"

    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    team: Mapped["Team"] = relationship("Team", back_populates="members")
    user: Mapped["User"] = relationship("User")
```

---

### `app/models/track.py`
> tracks table — problem tracks within a hackathon (e.g. AI, Web3, Sustainability)

```python
import uuid
from sqlalchemy import String, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class Track(BaseModel):
    __tablename__ = "tracks"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prize: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
```

---

### `app/models/submission.py`
> submissions table — one submission per team per hackathon

```python
import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class SubmissionStatus(str, enum.Enum):
    draft = "draft"          # team is still working on it
    submitted = "submitted"  # finalized and ready for judging
    disqualified = "disqualified"


class Submission(BaseModel):
    __tablename__ = "submissions"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    deck_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_usage: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(SubmissionStatus), default=SubmissionStatus.draft, nullable=False
    )

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    team: Mapped["Team"] = relationship("Team")
```

---

### `app/models/judge.py`
> judges table — which users are judges for which hackathon

```python
import enum
import uuid
from sqlalchemy import ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class JudgeStatus(str, enum.Enum):
    invited = "invited"
    accepted = "accepted"
    declined = "declined"


class Judge(BaseModel):
    __tablename__ = "judges"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[JudgeStatus] = mapped_column(
        SAEnum(JudgeStatus), default=JudgeStatus.invited, nullable=False
    )
    conflict_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")
```

---

### `app/models/rubric_criteria.py`
> rubric_criteria table — scoring criteria defined by organizer

```python
import uuid
from sqlalchemy import String, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class RubricCriteria(BaseModel):
    __tablename__ = "rubric_criteria"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # e.g. "Innovation", "Technical Complexity", "Presentation"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_score: Mapped[int] = mapped_column(Integer, default=10)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    # weight used in leaderboard: total = sum(score * weight) for all criteria
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
```

---

### `app/models/score.py`
> scores table — one row per judge per criterion per submission

```python
import uuid
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class Score(BaseModel):
    __tablename__ = "scores"

    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False
    )
    judge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    criterion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rubric_criteria.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    submission: Mapped["Submission"] = relationship("Submission")
    judge: Mapped["User"] = relationship("User")
    criterion: Mapped["RubricCriteria"] = relationship("RubricCriteria")
```

---

### `app/models/certificate.py`
> certificates table — issued certificates with public verification ID

```python
import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class CertificateType(str, enum.Enum):
    participant = "participant"
    winner = "winner"
    runner_up = "runner_up"
    judge = "judge"


class Certificate(BaseModel):
    __tablename__ = "certificates"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[CertificateType] = mapped_column(SAEnum(CertificateType), nullable=False)
    verification_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    # verification_id is a random URL-safe string used to publicly verify the certificate

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    user: Mapped["User"] = relationship("User")
```

---

### `app/models/announcement.py`
> announcements table — updates posted by organizers

```python
import uuid
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel


class Announcement(BaseModel):
    __tablename__ = "announcements"

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    hackathon: Mapped["Hackathon"] = relationship("Hackathon")
    author: Mapped["User"] = relationship("User")
```

---

## 5. SCHEMAS
> Pydantic models — defines what the API accepts and what it returns
> Models ≠ Schemas. Models = database. Schemas = API contracts.

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
    """What the API accepts to register a new user"""
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.participant
    org_name: str | None = None


class UserLogin(BaseModel):
    """What the API accepts to login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """What the API returns — hashed_password is NEVER included"""
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

---

### `app/schemas/organization.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    website_url: str | None = None


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    website_url: str | None
    owner_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/hackathon.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.hackathon import HackathonMode, HackathonStatus, RegistrationMode


class HackathonCreate(BaseModel):
    title: str
    slug: str
    tagline: str | None = None
    description: str | None = None
    mode: HackathonMode = HackathonMode.online
    max_participants: int = 200
    max_team_size: int = 4
    min_team_size: int = 1
    registration_mode: RegistrationMode = RegistrationMode.open
    prize_pool: str | None = None
    contact_email: str | None = None


class HackathonUpdate(BaseModel):
    title: str | None = None
    tagline: str | None = None
    description: str | None = None
    mode: HackathonMode | None = None
    venue: str | None = None
    prize_pool: str | None = None
    contact_email: str | None = None


class HackathonResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    slug: str
    tagline: str | None
    mode: HackathonMode
    status: HackathonStatus
    max_participants: int
    max_team_size: int
    min_team_size: int
    registration_mode: RegistrationMode
    banner_url: str | None
    logo_url: str | None
    prize_pool: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/registration.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.registration import RegistrationStatus


class RegistrationCreate(BaseModel):
    form_data: dict = {}


class RegistrationStatusUpdate(BaseModel):
    status: RegistrationStatus


class RegistrationResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    status: RegistrationStatus
    form_data: dict
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/team.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str


class TeamJoin(BaseModel):
    invite_code: str


class TeamMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    name: str
    invite_code: str
    leader_id: uuid.UUID
    members: list[TeamMemberResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/track.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel


class TrackCreate(BaseModel):
    name: str
    description: str | None = None
    prize: str | None = None
    sort_order: int = 0


class TrackResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    name: str
    description: str | None
    prize: str | None
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/submission.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.submission import SubmissionStatus


class SubmissionCreate(BaseModel):
    title: str
    description: str
    github_url: str | None = None
    demo_url: str | None = None
    video_url: str | None = None
    deck_url: str | None = None
    ai_usage: str | None = None


class SubmissionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    video_url: str | None = None
    deck_url: str | None = None
    ai_usage: str | None = None


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    team_id: uuid.UUID
    title: str
    description: str
    github_url: str | None
    demo_url: str | None
    video_url: str | None
    deck_url: str | None
    ai_usage: str | None
    status: SubmissionStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/judge.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.judge import JudgeStatus


class JudgeInvite(BaseModel):
    user_id: uuid.UUID


class RubricCriteriaCreate(BaseModel):
    name: str
    description: str | None = None
    max_score: int = 10
    weight: int = 1
    sort_order: int = 0


class RubricCriteriaResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    name: str
    description: str | None
    max_score: int
    weight: int
    sort_order: int

    model_config = {"from_attributes": True}


class JudgeResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    status: JudgeStatus
    conflict_note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/score.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel


class ScoreCreate(BaseModel):
    criterion_id: uuid.UUID
    score: int
    comment: str | None = None


class ScoreResponse(BaseModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    judge_id: uuid.UUID
    criterion_id: uuid.UUID
    score: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/certificate.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.certificate import CertificateType


class CertificateIssue(BaseModel):
    user_id: uuid.UUID
    type: CertificateType


class CertificateResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    user_id: uuid.UUID
    type: CertificateType
    verification_id: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

### `app/schemas/announcement.py`

```python
import uuid
from datetime import datetime
from pydantic import BaseModel


class AnnouncementCreate(BaseModel):
    title: str
    content: str


class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    hackathon_id: uuid.UUID
    author_id: uuid.UUID
    title: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

## 6. UTILS

---

### `app/utils/hashing.py`
> Two functions used for password security

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Converts plain text password to bcrypt hash.
    "password123" → "$2b$12$randomsaltXXXhashed..."
    Every call produces a different hash even for the same input.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks if plain password matches the stored hash.
    Returns True or False.
    """
    return pwd_context.verify(plain_password, hashed_password)
```

---

## 7. SERVICES
> All business logic lives here. Services call the database. Routers call services.

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
    # Check if email already registered
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),  # never store plain text
        role=user_data.role,
        org_name=user_data.org_name,
    )
    db.add(new_user)
    await db.flush()        # sends INSERT, gets id back, still inside transaction
    await db.refresh(new_user)  # reloads from DB to get server-generated values
    return new_user


async def login_user(login_data: UserLogin, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    # Same error for wrong email AND wrong password — never reveal which one failed
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
```

---

### `app/services/organization_service.py`

```python
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationCreate


async def create_organization(data: OrganizationCreate, current_user: User, db: AsyncSession) -> Organization:
    result = await db.execute(select(Organization).where(Organization.slug == data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Organization slug already taken")

    org = Organization(
        name=data.name, slug=data.slug,
        description=data.description, website_url=data.website_url,
        owner_id=current_user.id,
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


async def get_my_organizations(current_user: User, db: AsyncSession) -> list[Organization]:
    result = await db.execute(select(Organization).where(Organization.owner_id == current_user.id))
    return list(result.scalars().all())
```

---

### `app/services/hackathon_service.py`

```python
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.hackathon import Hackathon, HackathonStatus
from app.models.user import User
from app.schemas.hackathon import HackathonCreate


async def create_hackathon(data: HackathonCreate, organization_id: uuid.UUID, current_user: User, db: AsyncSession) -> Hackathon:
    result = await db.execute(select(Hackathon).where(Hackathon.slug == data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Hackathon slug already taken")

    hackathon = Hackathon(organization_id=organization_id, created_by=current_user.id, **data.model_dump())
    db.add(hackathon)
    await db.flush()
    await db.refresh(hackathon)
    return hackathon


async def get_hackathon_by_slug(slug: str, db: AsyncSession) -> Hackathon:
    result = await db.execute(select(Hackathon).where(Hackathon.slug == slug))
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon


async def publish_hackathon(hackathon_id: uuid.UUID, current_user: User, db: AsyncSession) -> Hackathon:
    result = await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    hackathon.status = HackathonStatus.published
    await db.flush()
    await db.refresh(hackathon)
    return hackathon


async def update_website_config(hackathon_id: uuid.UUID, config: dict, current_user: User, db: AsyncSession) -> Hackathon:
    result = await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    hackathon.website_config = config
    await db.flush()
    await db.refresh(hackathon)
    return hackathon


async def get_all_hackathons(db: AsyncSession) -> list[Hackathon]:
    result = await db.execute(select(Hackathon).where(Hackathon.status == HackathonStatus.published))
    return list(result.scalars().all())
```

---

### `app/services/registration_service.py`

```python
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.registration import Registration, RegistrationStatus
from app.models.hackathon import Hackathon, RegistrationMode
from app.models.user import User
from app.schemas.registration import RegistrationCreate


async def register_for_hackathon(hackathon_id: uuid.UUID, data: RegistrationCreate, current_user: User, db: AsyncSession) -> Registration:
    result = await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    result = await db.execute(select(Registration).where(
        Registration.hackathon_id == hackathon_id, Registration.user_id == current_user.id
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already registered")

    # Auto-approve if open registration, pending if approval mode
    initial_status = (
        RegistrationStatus.approved
        if hackathon.registration_mode == RegistrationMode.open
        else RegistrationStatus.pending
    )

    registration = Registration(
        hackathon_id=hackathon_id, user_id=current_user.id,
        status=initial_status, form_data=data.form_data,
    )
    db.add(registration)
    await db.flush()
    await db.refresh(registration)
    return registration


async def get_hackathon_registrations(hackathon_id: uuid.UUID, db: AsyncSession) -> list[Registration]:
    result = await db.execute(select(Registration).where(Registration.hackathon_id == hackathon_id))
    return list(result.scalars().all())


async def update_registration_status(registration_id: uuid.UUID, new_status: RegistrationStatus, db: AsyncSession) -> Registration:
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    registration.status = new_status
    await db.flush()
    await db.refresh(registration)
    return registration
```

---

### `app/services/team_service.py`

```python
import uuid
import secrets
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.hackathon import Hackathon
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User
from app.schemas.team import TeamCreate


def _generate_invite_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


async def _get_user_team(hackathon_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Team | None:
    result = await db.execute(
        select(Team).join(TeamMember, TeamMember.team_id == Team.id)
        .where(Team.hackathon_id == hackathon_id, TeamMember.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_team(hackathon_id: uuid.UUID, data: TeamCreate, current_user: User, db: AsyncSession) -> Team:
    # Must be approved to create team
    result = await db.execute(select(Registration).where(
        Registration.hackathon_id == hackathon_id,
        Registration.user_id == current_user.id,
        Registration.status == RegistrationStatus.approved,
    ))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must be approved to create a team")

    if await _get_user_team(hackathon_id, current_user.id, db):
        raise HTTPException(status_code=400, detail="Already in a team")

    result = await db.execute(select(Team).where(
        Team.hackathon_id == hackathon_id, Team.name == data.name
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team name already taken")

    team = Team(hackathon_id=hackathon_id, name=data.name,
                invite_code=_generate_invite_code(), leader_id=current_user.id)
    db.add(team)
    await db.flush()

    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    await db.flush()
    await db.refresh(team)
    return team


async def join_team(hackathon_id: uuid.UUID, invite_code: str, current_user: User, db: AsyncSession) -> Team:
    result = await db.execute(select(Registration).where(
        Registration.hackathon_id == hackathon_id,
        Registration.user_id == current_user.id,
        Registration.status == RegistrationStatus.approved,
    ))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must be approved to join a team")

    if await _get_user_team(hackathon_id, current_user.id, db):
        raise HTTPException(status_code=400, detail="Already in a team")

    result = await db.execute(select(Team).where(
        Team.invite_code == invite_code, Team.hackathon_id == hackathon_id
    ))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    hackathon_result = await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
    hackathon = hackathon_result.scalar_one_or_none()

    count_result = await db.execute(
        select(func.count()).select_from(TeamMember).where(TeamMember.team_id == team.id)
    )
    if hackathon and count_result.scalar() >= hackathon.max_team_size:
        raise HTTPException(status_code=400, detail="Team is full")

    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    await db.flush()
    await db.refresh(team)
    return team


async def get_my_team(hackathon_id: uuid.UUID, current_user: User, db: AsyncSession) -> Team:
    team = await _get_user_team(hackathon_id, current_user.id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Not in a team")
    return team


async def leave_team(hackathon_id: uuid.UUID, current_user: User, db: AsyncSession) -> dict:
    team = await _get_user_team(hackathon_id, current_user.id, db)
    if not team:
        raise HTTPException(status_code=404, detail="Not in a team")

    result = await db.execute(select(TeamMember).where(
        TeamMember.team_id == team.id, TeamMember.user_id == current_user.id
    ))
    member = result.scalar_one_or_none()
    if member:
        await db.delete(member)
        await db.flush()

    if team.leader_id == current_user.id:
        remaining = (await db.execute(
            select(TeamMember).where(TeamMember.team_id == team.id)
        )).scalars().all()
        if remaining:
            team.leader_id = remaining[0].user_id  # reassign leader
            await db.flush()
        else:
            await db.delete(team)
            await db.flush()
            return {"detail": "Team dissolved"}

    return {"detail": "Left team successfully"}
```

---

### `app/services/track_service.py`

```python
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.track import Track
from app.schemas.track import TrackCreate


async def create_track(hackathon_id: uuid.UUID, data: TrackCreate, db: AsyncSession) -> Track:
    track = Track(hackathon_id=hackathon_id, **data.model_dump())
    db.add(track)
    await db.flush()
    await db.refresh(track)
    return track


async def get_tracks(hackathon_id: uuid.UUID, db: AsyncSession) -> list[Track]:
    result = await db.execute(
        select(Track).where(Track.hackathon_id == hackathon_id).order_by(Track.sort_order)
    )
    return list(result.scalars().all())


async def delete_track(track_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    await db.delete(track)
    await db.flush()
```

---

### `app/services/submission_service.py`

```python
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.submission import Submission, SubmissionStatus
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionUpdate


async def _get_user_team_in_hackathon(hackathon_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Team | None:
    result = await db.execute(
        select(Team).join(TeamMember, TeamMember.team_id == Team.id)
        .where(Team.hackathon_id == hackathon_id, TeamMember.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_submission(hackathon_id: uuid.UUID, data: SubmissionCreate, current_user: User, db: AsyncSession) -> Submission:
    team = await _get_user_team_in_hackathon(hackathon_id, current_user.id, db)
    if not team:
        raise HTTPException(status_code=403, detail="You must be in a team to submit")
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can submit")

    result = await db.execute(select(Submission).where(
        Submission.hackathon_id == hackathon_id, Submission.team_id == team.id
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team already has a submission")

    submission = Submission(hackathon_id=hackathon_id, team_id=team.id, **data.model_dump())
    db.add(submission)
    await db.flush()
    await db.refresh(submission)
    return submission


async def update_submission(submission_id: uuid.UUID, data: SubmissionUpdate, current_user: User, db: AsyncSession) -> Submission:
    result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    team_result = await db.execute(select(Team).where(Team.id == submission.team_id))
    team = team_result.scalar_one_or_none()
    if not team or team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can update submission")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(submission, field, value)

    await db.flush()
    await db.refresh(submission)
    return submission


async def submit_submission(submission_id: uuid.UUID, current_user: User, db: AsyncSession) -> Submission:
    result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    team_result = await db.execute(select(Team).where(Team.id == submission.team_id))
    team = team_result.scalar_one_or_none()
    if not team or team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can submit")

    submission.status = SubmissionStatus.submitted
    await db.flush()
    await db.refresh(submission)
    return submission


async def get_hackathon_submissions(hackathon_id: uuid.UUID, db: AsyncSession) -> list[Submission]:
    result = await db.execute(select(Submission).where(Submission.hackathon_id == hackathon_id))
    return list(result.scalars().all())
```

---

### `app/services/judging_service.py`

```python
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.judge import Judge, JudgeStatus
from app.models.rubric_criteria import RubricCriteria
from app.models.score import Score
from app.models.user import User
from app.schemas.judge import JudgeInvite, RubricCriteriaCreate
from app.schemas.score import ScoreCreate


async def invite_judge(hackathon_id: uuid.UUID, data: JudgeInvite, db: AsyncSession) -> Judge:
    result = await db.execute(select(Judge).where(
        Judge.hackathon_id == hackathon_id, Judge.user_id == data.user_id
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already invited as judge")

    judge = Judge(hackathon_id=hackathon_id, user_id=data.user_id)
    db.add(judge)
    await db.flush()
    await db.refresh(judge)
    return judge


async def accept_judge_invite(hackathon_id: uuid.UUID, current_user: User, db: AsyncSession) -> Judge:
    result = await db.execute(select(Judge).where(
        Judge.hackathon_id == hackathon_id, Judge.user_id == current_user.id
    ))
    judge = result.scalar_one_or_none()
    if not judge:
        raise HTTPException(status_code=404, detail="Judge invite not found")
    judge.status = JudgeStatus.accepted
    await db.flush()
    await db.refresh(judge)
    return judge


async def create_rubric_criteria(hackathon_id: uuid.UUID, data: RubricCriteriaCreate, db: AsyncSession) -> RubricCriteria:
    criteria = RubricCriteria(hackathon_id=hackathon_id, **data.model_dump())
    db.add(criteria)
    await db.flush()
    await db.refresh(criteria)
    return criteria


async def get_rubric(hackathon_id: uuid.UUID, db: AsyncSession) -> list[RubricCriteria]:
    result = await db.execute(
        select(RubricCriteria).where(RubricCriteria.hackathon_id == hackathon_id).order_by(RubricCriteria.sort_order)
    )
    return list(result.scalars().all())


async def submit_score(submission_id: uuid.UUID, data: ScoreCreate, current_user: User, db: AsyncSession) -> Score:
    # If score already exists for this judge+criterion+submission, update it
    result = await db.execute(select(Score).where(
        Score.submission_id == submission_id,
        Score.judge_id == current_user.id,
        Score.criterion_id == data.criterion_id,
    ))
    existing = result.scalar_one_or_none()
    if existing:
        existing.score = data.score
        existing.comment = data.comment
        await db.flush()
        await db.refresh(existing)
        return existing

    score = Score(
        submission_id=submission_id, judge_id=current_user.id,
        criterion_id=data.criterion_id, score=data.score, comment=data.comment,
    )
    db.add(score)
    await db.flush()
    await db.refresh(score)
    return score


async def get_submission_scores(submission_id: uuid.UUID, db: AsyncSession) -> list[Score]:
    result = await db.execute(select(Score).where(Score.submission_id == submission_id))
    return list(result.scalars().all())
```

---

### `app/services/leaderboard_service.py`

```python
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.score import Score
from app.models.submission import Submission, SubmissionStatus
from app.models.team import Team
from app.models.rubric_criteria import RubricCriteria


async def get_leaderboard(hackathon_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    # Only rank submitted submissions
    submissions_result = await db.execute(
        select(Submission).where(
            Submission.hackathon_id == hackathon_id,
            Submission.status == SubmissionStatus.submitted,
        )
    )
    submissions = submissions_result.scalars().all()
    if not submissions:
        return []

    submission_ids = [s.id for s in submissions]

    # Calculate weighted score per submission
    # weighted_total = SUM(score.score * criteria.weight)
    scores_result = await db.execute(
        select(
            Score.submission_id,
            func.sum(Score.score * RubricCriteria.weight).label("total_score"),
            func.count(Score.id).label("score_count"),
        )
        .join(RubricCriteria, RubricCriteria.id == Score.criterion_id)
        .where(Score.submission_id.in_(submission_ids))
        .group_by(Score.submission_id)
    )
    scores_map = {
        row.submission_id: {"total_score": float(row.total_score or 0), "score_count": row.score_count}
        for row in scores_result
    }

    leaderboard = []
    for submission in submissions:
        team_result = await db.execute(select(Team).where(Team.id == submission.team_id))
        team = team_result.scalar_one_or_none()
        score_data = scores_map.get(submission.id, {"total_score": 0, "score_count": 0})
        leaderboard.append({
            "submission_id": str(submission.id),
            "team_id": str(submission.team_id),
            "team_name": team.name if team else "Unknown",
            "submission_title": submission.title,
            "total_score": score_data["total_score"],
            "score_count": score_data["score_count"],
        })

    # Sort highest score first, add rank
    leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return leaderboard
```

---

### `app/services/certificate_service.py`

```python
import uuid
import secrets
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.certificate import Certificate, CertificateType
from app.models.hackathon import Hackathon
from app.models.user import User
from app.schemas.certificate import CertificateIssue


async def issue_certificate(hackathon_id: uuid.UUID, data: CertificateIssue, current_user: User, db: AsyncSession) -> Certificate:
    result = await db.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
    hackathon = result.scalar_one_or_none()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(Certificate).where(
        Certificate.hackathon_id == hackathon_id,
        Certificate.user_id == data.user_id,
        Certificate.type == data.type,
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Certificate already issued")

    certificate = Certificate(
        hackathon_id=hackathon_id, user_id=data.user_id,
        type=data.type, verification_id=secrets.token_urlsafe(32),
    )
    db.add(certificate)
    await db.flush()
    await db.refresh(certificate)
    return certificate


async def get_my_certificates(current_user: User, db: AsyncSession) -> list[Certificate]:
    result = await db.execute(select(Certificate).where(Certificate.user_id == current_user.id))
    return list(result.scalars().all())


async def verify_certificate(verification_id: str, db: AsyncSession) -> Certificate:
    result = await db.execute(select(Certificate).where(Certificate.verification_id == verification_id))
    certificate = result.scalar_one_or_none()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")
    return certificate


async def get_hackathon_certificates(hackathon_id: uuid.UUID, db: AsyncSession) -> list[Certificate]:
    result = await db.execute(select(Certificate).where(Certificate.hackathon_id == hackathon_id))
    return list(result.scalars().all())
```

---

### `app/services/announcement_service.py`

```python
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.announcement import Announcement
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate


async def create_announcement(hackathon_id: uuid.UUID, data: AnnouncementCreate, current_user: User, db: AsyncSession) -> Announcement:
    announcement = Announcement(
        hackathon_id=hackathon_id, author_id=current_user.id,
        title=data.title, content=data.content,
    )
    db.add(announcement)
    await db.flush()
    await db.refresh(announcement)
    return announcement


async def get_announcements(hackathon_id: uuid.UUID, db: AsyncSession) -> list[Announcement]:
    result = await db.execute(
        select(Announcement).where(Announcement.hackathon_id == hackathon_id)
        .order_by(Announcement.created_at.desc())
    )
    return list(result.scalars().all())
```

---

### `app/services/analytics_service.py`

```python
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.registration import Registration, RegistrationStatus
from app.models.team import Team
from app.models.submission import Submission, SubmissionStatus
from app.models.score import Score
from app.models.judge import Judge, JudgeStatus


async def get_analytics(hackathon_id: uuid.UUID, db: AsyncSession) -> dict:
    total_reg = (await db.execute(
        select(func.count()).select_from(Registration).where(Registration.hackathon_id == hackathon_id)
    )).scalar()

    approved_reg = (await db.execute(
        select(func.count()).select_from(Registration).where(
            Registration.hackathon_id == hackathon_id, Registration.status == RegistrationStatus.approved
        )
    )).scalar()

    pending_reg = (await db.execute(
        select(func.count()).select_from(Registration).where(
            Registration.hackathon_id == hackathon_id, Registration.status == RegistrationStatus.pending
        )
    )).scalar()

    total_teams = (await db.execute(
        select(func.count()).select_from(Team).where(Team.hackathon_id == hackathon_id)
    )).scalar()

    total_submissions = (await db.execute(
        select(func.count()).select_from(Submission).where(Submission.hackathon_id == hackathon_id)
    )).scalar()

    submitted = (await db.execute(
        select(func.count()).select_from(Submission).where(
            Submission.hackathon_id == hackathon_id, Submission.status == SubmissionStatus.submitted
        )
    )).scalar()

    total_judges = (await db.execute(
        select(func.count()).select_from(Judge).where(Judge.hackathon_id == hackathon_id)
    )).scalar()

    accepted_judges = (await db.execute(
        select(func.count()).select_from(Judge).where(
            Judge.hackathon_id == hackathon_id, Judge.status == JudgeStatus.accepted
        )
    )).scalar()

    total_scores = (await db.execute(
        select(func.count()).select_from(Score)
        .join(Submission, Submission.id == Score.submission_id)
        .where(Submission.hackathon_id == hackathon_id)
    )).scalar()

    return {
        "registrations": {"total": total_reg, "approved": approved_reg, "pending": pending_reg},
        "teams": {"total": total_teams},
        "submissions": {"total": total_submissions, "submitted": submitted, "draft": total_submissions - submitted},
        "judging": {"total_judges": total_judges, "accepted_judges": accepted_judges, "total_scores_given": total_scores},
    }
```

---

## 8. ROUTERS
> URL definitions only. One file per feature. All logic delegated to services.

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
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(user_data, db)

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await login_user(login_data, db)
```

---

### `app/routers/organizations.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.organization import OrganizationCreate, OrganizationResponse
from app.services.organization_service import create_organization, get_my_organizations

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("/", response_model=OrganizationResponse, status_code=201)
async def create_org(data: OrganizationCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_organization(data, current_user, db)

@router.get("/me", response_model=list[OrganizationResponse])
async def my_organizations(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_my_organizations(current_user, db)
```

---

### `app/routers/hackathons.py`

```python
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import
