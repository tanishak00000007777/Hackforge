# HackForge Backend
### Customizable Hackathon Hosting SaaS — Python FastAPI + Supabase PostgreSQL

---

## What is HackForge?

HackForge is a platform where organizers can create and run hackathons end to end. Think of it like "Shopify for hackathons" — one platform that handles everything:

- Organizers create branded hackathon events and manage everything from one dashboard
- Participants register, form teams, and submit projects
- Judges score submissions using a custom rubric
- Leaderboard and certificates are generated automatically

This repository contains the **backend API only**. The frontend is a separate React project.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | FastAPI 0.111.0 | Fast, modern, auto-generates Swagger docs |
| Language | Python 3.10 | |
| Database | Supabase PostgreSQL | Free hosted PostgreSQL with dashboard |
| ORM | SQLAlchemy 2.0 Async | Handles concurrent requests without blocking |
| DB Driver | asyncpg | Async PostgreSQL driver |
| Migrations | Alembic | Version control for database schema |
| Auth | JWT via python-jose | Stateless authentication |
| Password Hashing | bcrypt via passlib | Industry standard password security |
| Deployment | Railway / Render (planned) | |

---

## Getting Started

### Prerequisites
- Python 3.10+

### Setup

```bash
# Clone the repository
git clone https://github.com/tanishak00000007777/Hackforge.git
cd Hackforge

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and fill in your DATABASE_URL and SECRET_KEY

# Run all migrations (creates all 13 tables in Supabase)
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

### Access the API
- **Swagger UI (interactive docs):** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **Health Check:** `http://127.0.0.1:8000/health`

---

## Environment Variables

Create a `.env` file in the `backend/` folder:

```env
APP_NAME=HackForge
APP_VERSION=0.1.0
DEBUG=True
SECRET_KEY=your-super-secret-key-change-this-in-production

# IMPORTANT: change postgresql:// to postgresql+asyncpg://
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
FRONTEND_URL=http://localhost:4174

```

> ⚠️ Never commit `.env` to GitHub. Only commit `.env.example`.

---

## Folder Structure

```
backend/
├── alembic/                          ← Database migration history
│   ├── versions/                     ← One .py file per migration
│   ├── env.py                        ← Alembic async configuration
│   └── script.py.mako               ← Migration file template
│
├── app/
│   ├── main.py                       ← FastAPI app, all routers registered here
│   │
│   ├── config/
│   │   └── settings.py              ← Reads .env, exposes typed settings
│   │
│   ├── core/
│   │   ├── database.py              ← Async engine + session + Base
│   │   ├── dependencies.py          ← get_current_user() dependency
│   │   └── security.py             ← JWT create and decode
│   │
│   ├── models/                      ← SQLAlchemy ORM (database tables)
│   │   ├── __init__.py             ← Imports ALL models — required for Alembic
│   │   ├── base_model.py           ← Abstract base: id, created_at, updated_at
│   │   ├── user.py
│   │   ├── organization.py
│   │   ├── hackathon.py
│   │   ├── registration.py
│   │   ├── team.py
│   │   ├── team_member.py
│   │   ├── track.py
│   │   ├── submission.py
│   │   ├── judge.py
│   │   ├── rubric_criteria.py
│   │   ├── score.py
│   │   ├── certificate.py
│   │   └── announcement.py
│   │
│   ├── schemas/                     ← Pydantic models (API input/output)
│   │   ├── user.py
│   │   ├── organization.py
│   │   ├── hackathon.py
│   │   ├── registration.py
│   │   ├── team.py
│   │   ├── track.py
│   │   ├── submission.py
│   │   ├── judge.py
│   │   ├── score.py
│   │   ├── certificate.py
│   │   └── announcement.py
│   │
│   ├── routers/                     ← URL routes, one file per feature
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── organizations.py
│   │   ├── hackathons.py
│   │   ├── tracks.py
│   │   ├── registrations.py
│   │   ├── teams.py
│   │   ├── submissions.py
│   │   ├── judges.py
│   │   ├── leaderboard.py
│   │   ├── certificates.py
│   │   ├── announcements.py
│   │   └── analytics.py
│   │
│   ├── services/                    ← Business logic, one file per feature
│   │   ├── auth_service.py
│   │   ├── organization_service.py
│   │   ├── hackathon_service.py
│   │   ├── registration_service.py
│   │   ├── team_service.py
│   │   ├── track_service.py
│   │   ├── submission_service.py
│   │   ├── judging_service.py
│   │   ├── leaderboard_service.py
│   │   ├── certificate_service.py
│   │   ├── announcement_service.py
│   │   └── analytics_service.py
│   │
│   └── utils/
│       └── hashing.py              ← hash_password() and verify_password()
│
├── .env                             ← Never commit this
├── .env.example                     ← Commit this instead
├── alembic.ini
├── requirements.txt
└── requirements-dev.txt
```

---

## Database Tables

| Table | What it stores |
|-------|---------------|
| `users` | All users — organizers, participants, judges |
| `organizations` | College or company that owns hackathons |
| `hackathons` | Hackathon events with all configuration |
| `registrations` | Who registered for which hackathon |
| `teams` | Teams within a hackathon |
| `team_members` | Which users are in which team |
| `tracks` | Problem tracks (e.g. AI, Web3, Sustainability) |
| `submissions` | Project submissions from teams |
| `judges` | Which users are judges for which hackathon |
| `rubric_criteria` | Scoring criteria defined by organizer |
| `scores` | Individual scores given by judges per criterion |
| `certificates` | Issued certificates with unique verification ID |
| `announcements` | Updates sent by organizers to participants |

Every table automatically has: `id` (UUID), `created_at`, `updated_at`

---

## API Endpoints

### Public — No authentication required

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/v1/auth/register` | Create new account |
| POST | `/api/v1/auth/login` | Login and get JWT tokens |
| GET | `/api/v1/hackathons/` | List all published hackathons |
| GET | `/api/v1/hackathons/{slug}` | Get hackathon by slug |
| GET | `/api/v1/tracks/{hackathon_id}` | View tracks |
| GET | `/api/v1/judges/{hackathon_id}/rubric` | View scoring rubric |
| GET | `/api/v1/announcements/{hackathon_id}` | View announcements |
| GET | `/api/v1/certificates/verify/{verification_id}` | Verify a certificate |

### Protected — Requires `Authorization: Bearer <token>` header

#### Organizations
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/organizations/` | Create organization |
| GET | `/api/v1/organizations/me` | Get my organizations |

#### Hackathons
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/hackathons/{org_id}` | Create hackathon |
| POST | `/api/v1/hackathons/{id}/publish` | Publish hackathon |
| PATCH | `/api/v1/hackathons/{id}/website-config` | Update website design config |

#### Tracks
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/tracks/{hackathon_id}` | Add a track |
| DELETE | `/api/v1/tracks/{track_id}` | Delete a track |

#### Registrations
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/registrations/{hackathon_id}` | Register for hackathon |
| GET | `/api/v1/registrations/{hackathon_id}` | List all registrations |
| PATCH | `/api/v1/registrations/{id}/status` | Approve / reject / waitlist |

#### Teams
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/teams/{hackathon_id}` | Create team |
| POST | `/api/v1/teams/{hackathon_id}/join` | Join team via invite code |
| GET | `/api/v1/teams/{hackathon_id}/my-team` | Get my team |
| DELETE | `/api/v1/teams/{hackathon_id}/leave` | Leave team |

#### Submissions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/submissions/{hackathon_id}` | Create submission |
| PATCH | `/api/v1/submissions/{id}` | Update submission |
| POST | `/api/v1/submissions/{id}/submit` | Finalize and submit |
| GET | `/api/v1/submissions/{hackathon_id}/all` | List all submissions |

#### Judging
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/judges/{hackathon_id}/invite` | Invite a judge |
| POST | `/api/v1/judges/{hackathon_id}/accept` | Accept judge invitation |
| POST | `/api/v1/judges/{hackathon_id}/rubric` | Add rubric criteria |
| POST | `/api/v1/judges/scores/{submission_id}` | Submit a score |
| GET | `/api/v1/judges/scores/{submission_id}` | Get scores for submission |

#### Results
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/leaderboard/{hackathon_id}` | Get ranked leaderboard |
| POST | `/api/v1/certificates/{hackathon_id}/issue` | Issue certificate |
| GET | `/api/v1/certificates/me` | Get my certificates |
| GET | `/api/v1/certificates/{hackathon_id}` | List all certificates |

#### Announcements & Analytics
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/announcements/{hackathon_id}` | Post announcement |
| GET | `/api/v1/analytics/{hackathon_id}` | Get event statistics |

---

## Assigned Modules — Final Status

### 1. Organizer Workspace ✅ 100% Complete
Create org, create hackathon, publish, manage registrations, invite judges, build rubric, view submissions, analytics, announcements.

### 2. Hackathon Builder ✅ 100% Complete
Hackathon CRUD, track management, website_config JSONB, update website config endpoint.

### 3. Microsite Generator ✅ 100% Complete
website_config stored in hackathon, public GET by slug, list published hackathons, update config endpoint.

### 4. Registration & Application System ✅ 100% Complete
Register, open vs approval mode, approve/reject/waitlist, list registrations, form_data JSONB for custom fields.

### 5. Team Formation Flow ✅ 100% Complete
Create team, generate invite code, join by code, max size enforcement, view team, leave team.

---

## Alembic Commands

```bash
# After changing any model, generate a migration:
alembic revision --autogenerate -m "describe the change"

# Apply all pending migrations:
alembic upgrade head

# Roll back one migration:
alembic downgrade -1

# See migration history:
alembic history

# See current DB version:
alembic current
```

---

## Team Rules

1. **Routers never touch the database** — router calls service, service calls DB
2. **Never store plain text passwords** — always use `hash_password()` before saving
3. **Never return `hashed_password`** in any response — use `UserResponse` schema
4. **Never commit `.env`** — only commit `.env.example`
5. **Import every new model** in `models/__init__.py` or Alembic will not detect it
6. **Run migration after every model change** — never edit tables manually in Supabase
7. **Same error for wrong email and wrong password** — never reveal which one failed

---

