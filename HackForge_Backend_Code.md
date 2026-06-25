# HackForge Backend — Complete Code Documentation
> Python FastAPI + Supabase PostgreSQL
> Written so that anyone — even a beginner — can understand, run, and extend this project.

---

## What is This Project?

HackForge is a platform where organizers can create and run hackathons. Think of it like "Shopify for hackathons" — one platform that handles everything:
- Organizers create events and manage participants
- Participants register, form teams, and submit projects
- Judges score submissions using a rubric
- Leaderboard and certificates are generated automatically

This document covers the **backend only** — the API that the frontend talks to.

---

## How the Backend Works (Simple Explanation)

```
Frontend (React)
      ↓  sends HTTP requests
FastAPI (our backend)
      ↓  reads/writes data
Supabase PostgreSQL (our database hosted in the cloud)
```

When the frontend wants to register a user, it sends a POST request to our API.
Our API validates the data, hashes the password, saves it to Supabase, and returns a response.
That's it. Every feature works this same way.

---

## Tech Stack — What We Use and Why

| Tool | What it does | Why we chose it |
|------|-------------|----------------|
| **FastAPI** | Web framework — handles HTTP requests | Fast, modern, auto-generates Swagger docs |
| **SQLAlchemy (Async)** | Talks to the database | Handles multiple requests at the same time without slowing down |
| **asyncpg** | PostgreSQL driver | Async version — works with our async SQLAlchemy |
| **Alembic** | Database migrations | Tracks every change to the database like Git tracks code |
| **Pydantic** | Data validation | Automatically checks that incoming data is correct |
| **python-jose** | JWT tokens | Handles login sessions securely |
| **passlib + bcrypt** | Password hashing | Converts plain passwords to unreadable hashes |
| **Supabase** | Cloud PostgreSQL database | Free tier, easy setup, has a dashboard to view data |

---

## Project Folder Structure

```
hackforge/
└── backend/
    ├── alembic/                          ← Database migration files
    │   ├── versions/                     ← One .py file per migration
    │   ├── env.py                        ← Alembic configuration
    │   └── script.py.mako               ← Template for new migrations
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                       ← App entry point. Registers all routers.
    │   │
    │   ├── config/
    │   │   └── settings.py              ← Reads .env file. All config lives here.
    │   │
    │   ├── core/
    │   │   ├── database.py              ← Creates DB connection and session
    │   │   ├── dependencies.py          ← get_current_user() — used in all protected routes
    │   │   └── security.py             ← Creates and decodes JWT tokens
    │   │
    │   ├── models/                      ← Database tables (SQLAlchemy ORM)
    │   │   ├── __init__.py             ← MUST import every model here for Alembic
    │   │   ├── base_model.py           ← Parent class: gives id, created_at, updated_at to all models
    │   │   ├── user.py                 ← users table
    │   │   ├── organization.py         ← organizations table
    │   │   ├── hackathon.py            ← hackathons table
    │   │   ├── registration.py         ← registrations table
    │   │   ├── team.py                 ← teams table
    │   │   ├── team_member.py          ← team_members table
    │   │   ├── track.py                ← tracks table
    │   │   ├── submission.py           ← submissions table
    │   │   ├── judge.py                ← judges table
    │   │   ├── rubric_criteria.py      ← rubric_criteria table
    │   │   ├── score.py                ← scores table
    │   │   ├── certificate.py          ← certificates table
    │   │   └── announcement.py         ← announcements table
    │   │
    │   ├── schemas/                     ← What the API accepts and returns (Pydantic)
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
    │   ├── routers/                     ← URL routes. One file per feature.
    │   │   ├── __init__.py             ← Imports all routers
    │   │   ├── auth.py                 ← /auth/register, /auth/login
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
    │   ├── services/                    ← Business logic. Routers call these.
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
    ├── venv/                            ← Python virtual environment (never commit)
    ├── .env                             ← Secret keys and DB URL (never commit)
    ├── .env.example                     ← Empty template — commit this one
    ├── alembic.ini                      ← Alembic config file
    ├── requirements.txt                 ← Production dependencies
    └── requirements-dev.txt             ← Dev + test dependencies
```

---

## The Golden Rule of This Project

```
Router → Service → Database

Router:  only handles HTTP (receives request, returns response)
Service: only handles business logic (validation, rules, calculations)
Database: only stores and retrieves data

NEVER write database queries inside a router.
NEVER write business logic inside a router.
```

---

## How to Run This Project

### Step 1 — Clone and setup
```bash
git clone https://github.com/tanishak00000007777/Hackforge.git
cd Hackforge/backend

python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

### Step 2 — Configure environment
```bash
cp .env.example .env
# Open .env and fill in your values
```

### Step 3 — Run migrations (creates all tables in Supabase)
```bash
alembic upgrade head
```

### Step 4 — Start the server
```bash
uvicorn app.main:app --reload
```

### Step 5 — Open Swagger docs
```
http://127.0.0.1:8000/docs
```

---

## Environment Variables (.env)

```env
APP_NAME=HackForge
APP_VERSION=0.1.0
DEBUG=True
SECRET_KEY=your-super-secret-key-change-this-in-production

# From Supabase → Connect button → URI
# IMPORTANT: change postgresql:// to postgresql+asyncpg://
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> ⚠️ Never commit `.env` to GitHub. Only commit `.env.example` with empty values.

> If your Supabase password contains `@`, it gets URL-encoded as `%40`. Keep it as `%40` in the URL — that is correct.

---

## All Database Tables

| Table | What it stores |
|-------|---------------|
| `users` | All users — organizers, participants, judges |
| `organizations` | The college or company that owns hackathons |
| `hackathons` | Hackathon events with all settings |
| `registrations` | Who registered for which hackathon |
| `teams` | Teams within a hackathon |
| `team_members` | Which users are in which team |
| `tracks` | Problem tracks within a hackathon (e.g. AI, Web3) |
| `submissions` | Project submissions from teams |
| `judges` | Which users are judges for which hackathon |
| `rubric_criteria` | Scoring criteria set by organizer |
| `scores` | Individual scores given by judges |
| `certificates` | Issued certificates with verification ID |
| `announcements` | Updates sent by organizers to participants |

Every table automatically has: `id` (UUID), `created_at`, `updated_at`

---

## All API Endpoints

### 🔓 Public — No login required

| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/health` | Check if server is running |
| POST | `/api/v1/auth/register` | Create a new account |
| POST | `/api/v1/auth/login` | Login and get JWT tokens |
| GET | `/api/v1/hackathons/{slug}` | Get a hackathon by its URL slug |
| GET | `/api/v1/hackathons/` | List all published hackathons |
| GET | `/api/v1/judges/{hackathon_id}/rubric` | View scoring rubric |
| GET | `/api/v1/tracks/{hackathon_id}` | View tracks |
| GET | `/api/v1/announcements/{hackathon_id}` | View announcements |
| GET | `/api/v1/certificates/verify/{verification_id}` | Verify a certificate |

### 🔐 Protected — Login required (send Bearer token in header)

#### Organizations
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/organizations/` | Create an organization |
| GET | `/api/v1/organizations/me` | Get my organizations |

#### Hackathons
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/hackathons/{org_id}` | Create a hackathon |
| POST | `/api/v1/hackathons/{id}/publish` | Publish the hackathon |
| PATCH | `/api/v1/hackathons/{id}/website-config` | Update website design config |

#### Tracks
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/tracks/{hackathon_id}` | Add a track |
| DELETE | `/api/v1/tracks/{track_id}` | Delete a track |

#### Registrations
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/registrations/{hackathon_id}` | Register for a hackathon |
| GET | `/api/v1/registrations/{hackathon_id}` | List all registrations (organizer) |
| PATCH | `/api/v1/registrations/{id}/status` | Approve / reject / waitlist |

#### Teams
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/teams/{hackathon_id}` | Create a team |
| POST | `/api/v1/teams/{hackathon_id}/join` | Join a team using invite code |
| GET | `/api/v1/teams/{hackathon_id}/my-team` | Get my team |
| DELETE | `/api/v1/teams/{hackathon_id}/leave` | Leave a team |

#### Submissions
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/submissions/{hackathon_id}` | Create a submission |
| PATCH | `/api/v1/submissions/{id}` | Update submission |
| POST | `/api/v1/submissions/{id}/submit` | Finalize and submit |
| GET | `/api/v1/submissions/{hackathon_id}/all` | List all submissions |

#### Judging
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/judges/{hackathon_id}/invite` | Invite a judge |
| POST | `/api/v1/judges/{hackathon_id}/accept` | Accept judge invitation |
| POST | `/api/v1/judges/{hackathon_id}/rubric` | Add rubric criteria |
| POST | `/api/v1/judges/scores/{submission_id}` | Submit a score |
| GET | `/api/v1/judges/scores/{submission_id}` | Get scores for a submission |

#### Results
| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/api/v1/leaderboard/{hackathon_id}` | Get ranked leaderboard |
| POST | `/api/v1/certificates/{hackathon_id}/issue` | Issue a certificate |
| GET | `/api/v1/certificates/me` | Get my certificates |
| GET | `/api/v1/certificates/{hackathon_id}` | List all certificates for hackathon |

#### Announcements
| Method | URL | What it does |
|--------|-----|-------------|
| POST | `/api/v1/announcements/{hackathon_id}` | Post an announcement |

#### Analytics
| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/api/v1/analytics/{hackathon_id}` | Get registration, team, submission, judge stats |

---

## How Authentication Works

```
1. User registers → password gets hashed → user saved in DB
2. User logs in → password verified → two tokens returned:
   - access_token  → expires in 60 mins → used for every API call
   - refresh_token → expires in 7 days  → used to get new access token

3. For protected routes, frontend sends:
   Header: Authorization: Bearer <access_token>

4. Backend decodes the token → gets user ID → fetches user from DB
5. If token is invalid or expired → returns 401 Unauthorized
```

---

## Key Files Explained

### `app/config/settings.py`
Reads all environment variables from `.env` once when the app starts.
`@lru_cache()` means it only reads the file once — not on every request.

### `app/core/database.py`
Creates the connection to Supabase. The `get_db()` function gives each request its own database session and automatically commits on success or rolls back on error.

### `app/core/dependencies.py`
`get_current_user()` is used in every protected route. It reads the JWT token from the request header, decodes it, and returns the full User object from the database.

```python
# How to protect any route:
@router.get("/something")
async def my_route(current_user = Depends(get_current_user)):
    # current_user is the logged-in User object
```

### `app/models/base_model.py`
Every model inherits from this. It gives every table `id`, `created_at`, `updated_at` automatically. `__abstract__ = True` means this class itself never creates a table.

### `app/models/__init__.py`
Imports every model. This is critical — Alembic discovers tables through `Base.metadata`. If a model is not imported here, Alembic will not see it and will not create the table.

```python
# Current state of models/__init__.py
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

## Alembic — Database Migrations Explained

Alembic is version control for your database. Every time you change a model, you create a migration file that describes the change. This way everyone on the team can sync their database with one command.

```bash
# After changing any model file, run this to generate a migration:
alembic revision --autogenerate -m "describe what you changed"

# Then apply the migration to the database:
alembic upgrade head

# Roll back the last migration if something went wrong:
alembic downgrade -1

# See what migrations have been applied:
alembic history

# See current version your DB is on:
alembic current
```

> ⚠️ If your Supabase password has `%` in it, the migration will fail with a configparser error.
> Fix: in `alembic/env.py`, use `settings.database_url.replace("%", "%%")`

---

## How to Add a New Feature (Step by Step)

Say you want to add a `Sponsor` feature. Here is exactly what to do:

**Step 1 — Create the model** `app/models/sponsor.py`
```python
from app.models.base_model import BaseModel
# define your table columns here
```

**Step 2 — Import it** in `app/models/__init__.py`
```python
from app.models.sponsor import Sponsor
```

**Step 3 — Create the schema** `app/schemas/sponsor.py`
```python
# SponsorCreate, SponsorResponse using Pydantic BaseModel
```

**Step 4 — Create the service** `app/services/sponsor_service.py`
```python
# All business logic — create_sponsor(), get_sponsors(), etc.
```

**Step 5 — Create the router** `app/routers/sponsors.py`
```python
router = APIRouter(prefix="/sponsors", tags=["Sponsors"])
# routes that call service functions
```

**Step 6 — Register the router** in `app/main.py`
```python
app.include_router(sponsors.router, prefix=API_PREFIX)
```

**Step 7 — Run migration**
```bash
alembic revision --autogenerate -m "add_sponsors"
alembic upgrade head
```

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `getaddrinfo failed` | Cannot reach Supabase | Switch to mobile hotspot or change DNS to 8.8.8.8 |
| `invalid interpolation syntax` | `%` in password breaks configparser | Use `.replace("%", "%%")` in env.py |
| `ModuleNotFoundError: No module named 'app'` | Running from wrong folder | `cd backend` first |
| `FAILED: No config file 'alembic.ini' found` | Wrong folder | Must be in `backend/` folder to run alembic |
| `already in a team` | User already joined a team | Each user can only be in one team per hackathon |
| `401 Unauthorized` | Token missing or expired | Login again and use the new access_token |
| `SSL Fatal error` on Windows | Windows event loop cleanup | Safe to ignore — only happens in test scripts, not in FastAPI |

---

## Phase Completion

| Phase | What was built | Status |
|-------|---------------|--------|
| Phase 1 | FastAPI setup, folder structure, all routers skeleton | ✅ Done |
| Phase 2 | Supabase connection via asyncpg | ✅ Done |
| Phase 3 | BaseModel with id, created_at, updated_at | ✅ Done |
| Phase 4 | User model, auth, JWT register + login | ✅ Done |
| Phase 5 | Organization model + CRUD | ✅ Done |
| Phase 6 | Hackathon model + publish + website config | ✅ Done |
| Phase 7 | Registration system with approval workflow | ✅ Done |
| Phase 8 | Team formation — create, join, leave | ✅ Done |
| Phase 9 | Submission portal — create, update, submit | ✅ Done |
| Phase 10 | Judging — invite, rubric builder, scoring | ✅ Done |
| Phase 11 | Leaderboard with weighted scoring | ✅ Done |
| Phase 12 | Tracks + website config update endpoint | ✅ Done |
| Phase 13 | Certificate generation + verification | ✅ Done |
| Phase 14 | Leave team endpoint | ✅ Done |
| Phase 15 | Announcements | ✅ Done |
| Phase 16 | Analytics dashboard | ✅ Done |

---

## Team Rules

1. **Routers never touch the database** — router calls service, service calls DB
2. **Never store plain text passwords** — always hash with `hash_password()` before saving
3. **Never return `hashed_password`** in any API response — use `UserResponse` schema
4. **Never commit `.env`** — only commit `.env.example` with empty values
5. **Import every new model** in `models/__init__.py` or Alembic will not see it
6. **Run migration after every model change** — never edit the database manually
7. **Same error for wrong email and wrong password** — never reveal which one is wrong
