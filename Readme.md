# HackForge Backend
### Customizable Hackathon Hosting SaaS — Python FastAPI + Supabase PostgreSQL

---

## Project Overview

HackForge is a multi-tenant hackathon hosting platform that allows organizers to create and manage hackathons, participants to register and submit projects, and judges to score submissions — all through a single REST API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.111.0 |
| Language | Python 3.10 |
| Database | Supabase PostgreSQL |
| ORM | SQLAlchemy 2.0 (Async) |
| Driver | asyncpg |
| Migrations | Alembic |
| Auth | JWT (python-jose) |
| Password Hashing | bcrypt via passlib |
| Deployment | Vercel / Railway (planned) |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Supabase account and project

### Setup

```bash
# Clone the repository
git clone https://github.com/tanishak0000007777/hackforge-backend.git
cd hackforge-backend/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in your Supabase DATABASE_URL and SECRET_KEY in .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### API Documentation
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health Check: `http://127.0.0.1:8000/health`

---

## Folder Structure

```
backend/
├── alembic/                  ← Database migrations
│   └── versions/
├── app/
│   ├── config/
│   │   └── settings.py       ← Environment variables
│   ├── core/
│   │   ├── database.py       ← Async SQLAlchemy engine
│   │   ├── dependencies.py   ← JWT auth dependency
│   │   └── security.py       ← JWT create/decode
│   ├── models/               ← SQLAlchemy ORM models
│   ├── schemas/              ← Pydantic request/response
│   ├── routers/              ← API route handlers
│   ├── services/             ← Business logic
│   ├── middleware/
│   ├── utils/
│   │   └── hashing.py        ← Password hashing
│   └── main.py               ← FastAPI app entry point
├── .env.example
├── requirements.txt
└── requirements-dev.txt
```

---

## Database Tables

| Table | Status |
|-------|--------|
| users | ✅ Complete |
| organizations | ✅ Complete |
| hackathons | ✅ Complete |
| registrations | ✅ Complete |
| teams | ✅ Complete |
| team_members | ✅ Complete |
| submissions | ✅ Complete |
| judges | ✅ Complete |
| rubric_criteria | ✅ Complete |
| scores | ✅ Complete |

---

## API Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, get JWT tokens |

### Organizations
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/organizations/` | Create organization |
| GET | `/api/v1/organizations/me` | Get my organizations |

### Hackathons
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/hackathons/{org_id}` | Create hackathon |
| GET | `/api/v1/hackathons/{slug}` | Get hackathon by slug |
| POST | `/api/v1/hackathons/{id}/publish` | Publish hackathon |

### Registrations
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/registrations/{hackathon_id}` | Register for hackathon |
| GET | `/api/v1/registrations/{hackathon_id}` | List registrations |
| PATCH | `/api/v1/registrations/{id}/status` | Approve/reject/waitlist |

### Teams
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/teams/{hackathon_id}` | Create team |
| POST | `/api/v1/teams/{hackathon_id}/join` | Join team via invite code |
| GET | `/api/v1/teams/{hackathon_id}/my-team` | Get my team |

### Submissions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/submissions/{hackathon_id}` | Create submission |
| PATCH | `/api/v1/submissions/{id}` | Update submission |
| POST | `/api/v1/submissions/{id}/submit` | Finalize submission |
| GET | `/api/v1/submissions/{hackathon_id}/all` | List all submissions |

### Judging
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/judges/{hackathon_id}/invite` | Invite judge |
| POST | `/api/v1/judges/{hackathon_id}/accept` | Accept judge invite |
| POST | `/api/v1/judges/{hackathon_id}/rubric` | Add rubric criteria |
| GET | `/api/v1/judges/{hackathon_id}/rubric` | Get rubric |
| POST | `/api/v1/judges/scores/{submission_id}` | Submit score |
| GET | `/api/v1/judges/scores/{submission_id}` | Get scores |

### Leaderboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/leaderboard/{hackathon_id}` | Get ranked leaderboard |

---

## Backend Phase Progress

| Phase | Task | Status |
|-------|------|--------|
| Phase 1 | FastAPI project setup | ✅ Complete |
| Phase 2 | Supabase connection | ✅ Complete |
| Phase 3 | Base model (id, timestamps) | ✅ Complete |
| Phase 4 | Authentication (register, login, JWT) | ✅ Complete |
| Phase 5 | Organization model + CRUD | ✅ Complete |
| Phase 6 | Hackathon model + publish flow | ✅ Complete |
| Phase 7 | Registration system | ✅ Complete |
| Phase 8 | Team formation (create, join, invite code) | ✅ Complete |
| Phase 9 | Submission portal | ✅ Complete |
| Phase 10 | Judging (rubric, scoring) | ✅ Complete |
| Phase 11 | Leaderboard (weighted scoring) | ✅ Complete |
| Phase 12 | Certificates | ⏳ Pending |

---

## Assigned Product Modules vs Progress

These are the 5 modules assigned by the mentor:

### 1. Organizer Workspace
**What it covers:** Organization creation, hackathon creation, publishing, settings, registration management, judge management, rubric builder.

| Feature | Backend Status |
|---------|---------------|
| Create organization | ✅ Done |
| Create hackathon | ✅ Done |
| Publish hackathon | ✅ Done |
| Registration approval workflow | ✅ Done |
| Judge invitation | ✅ Done |
| Rubric builder | ✅ Done |
| View all submissions | ✅ Done |
| Analytics dashboard | ❌ Not started |

**Backend completion: ~85%**

---

### 2. Hackathon Builder
**What it covers:** Website config (template, colors, fonts, sections), hackathon details, tracks, prizes.

| Feature | Backend Status |
|---------|---------------|
| Hackathon CRUD | ✅ Done |
| website_config JSONB field | ✅ Done (field exists, endpoints pending) |
| Track management | ❌ Not started |
| Website config update endpoint | ❌ Not started |

**Backend completion: ~40%**

---

### 3. Microsite Generator (Template-Based)
**What it covers:** Public event page rendered from website_config, template selection, section toggle.

| Feature | Backend Status |
|---------|---------------|
| website_config stored in hackathon | ✅ Done |
| Public GET hackathon by slug | ✅ Done |
| Update website config endpoint | ❌ Not started |

**Backend completion: ~50%**

---

### 4. Registration & Application System
**What it covers:** Participant registration, approval/rejection/waitlist, form data collection.

| Feature | Backend Status |
|---------|---------------|
| Register for hackathon | ✅ Done |
| Open vs approval mode | ✅ Done |
| Approve / reject / waitlist | ✅ Done |
| List registrations | ✅ Done |
| Custom form fields | ⚠️ Partial (form_data JSONB exists) |

**Backend completion: ~90%**

---

### 5. Team Formation Flow
**What it covers:** Create team, join by invite code, view team, max size enforcement.

| Feature | Backend Status |
|---------|---------------|
| Create team | ✅ Done |
| Generate invite code | ✅ Done |
| Join team via invite code | ✅ Done |
| Max team size enforcement | ✅ Done |
| View my team | ✅ Done |
| Leave team | ❌ Not started |
| Remove member | ❌ Not started |

**Backend completion: ~75%**

---

## What Is Remaining

### Must complete before frontend integration:
1. **Track management** — `POST/GET/DELETE /tracks/{hackathon_id}` (1-2 hours)
2. **Website config update** — `PATCH /hackathons/{id}/website-config` (30 mins)
3. **Leave team endpoint** (30 mins)
4. **Certificate generation** — Phase 12 (2-3 hours)

### Can be done in parallel with frontend:
- Analytics endpoints (registration count, team count, submission count)
- Announcement system
- Export CSV

---


---

## Rules

1. Routers never touch the database directly — router calls service, service calls DB
2. Never store plain text passwords
3. Never expose `hashed_password` in API responses
4. Never commit `.env` to GitHub
5. Every new model must be imported in `models/__init__.py`
6. Run migration after every model change
