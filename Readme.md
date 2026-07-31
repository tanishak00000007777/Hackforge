# HackForge

### Customizable Hackathon Hosting SaaS — FastAPI + PostgreSQL + React

---

## What is HackForge?

HackForge is a platform where organizers can run a hackathon end to end — think "Shopify for hackathons." One platform handles the entire lifecycle:

- **Organizers** create a branded hackathon, design a public microsite for it, build custom registration forms, and manage everything from one dashboard.
- **Participants** discover hackathons, register, form (or join) teams, and submit their projects.
- **Judges** score submissions against a rubric the organizer defines.
- **Leaderboards and certificates** are generated automatically once judging closes.

This is a monorepo containing one backend API and one primary frontend application with the Lovable workspace embedded inline:

| Part | Path | What it is |
|---|---|---|
| **Backend API** | `app/` (repo root) | FastAPI service — auth, hackathons, teams, judging, certificates, etc. |
| **Main web app** | `FrontEnd/hackforge-react/` | The product itself — login, organizer/participant/judge dashboards, forms, certificates |
| **Lovable Canvas Studio** | `FrontEnd/hackforge-react/src/lovable-canvas/` | The exact drag-and-drop Lovable workspace, mounted inside the primary app |

---

## Features

- **Auth** — email/password signup & login, plus "Continue with Google" (Google Identity Services), JWT access + refresh tokens
- **Organizer workspace** — create an organization, create and publish hackathons, manage registrations, invite judges, view analytics
- **Hackathon builder & microsite generator** — each hackathon has a `website_config` that drives a public landing page at a unique slug
- **Website Studio** - the Lovable visual builder, protected and mounted inline at the organizer hackathon route
- **Custom form builder** — organizers build arbitrary registration/application forms (text, choice, file-upload questions via Cloudinary); participants fill them out publicly
- **Team formation** — create a team, get an invite code, join by code, max team size enforcement
- **Submissions** — teams submit projects, organizers/judges can list and review them
- **Judging** — organizer defines rubric criteria, judges score each submission per criterion
- **Leaderboard** — automatically ranked from judge scores
- **Certificates** — organizer defines a certificate template, bulk-issues certificates, participants download a PDF, anyone can verify a certificate via a public verification ID
- **Announcements** — organizers broadcast updates to registered participants
- **Analytics** — event-level stats for organizers
- **A-la-carte feature toggles** — organizers can enable/disable modules (teams, submissions, judging, leaderboard, certificates, announcements) per hackathon

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI 0.111 (Python 3.10+) |
| Database | PostgreSQL (local or hosted, e.g. Supabase) |
| ORM | SQLAlchemy 2.0 (async) via `asyncpg` |
| Migrations | Alembic |
| Auth | JWT (`python-jose`) + bcrypt password hashing (`passlib`) + Google OAuth |
| File storage | Cloudinary (form file-upload questions) |
| PDF generation | ReportLab (certificates) |
| Main frontend | React 19, React Router 7, Zustand, Vite |
| Website Studio | React 19, Tailwind CSS 4, react-grid-layout, Vite |
| Deployment | Railway (`railway.json` included) |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **PostgreSQL** — a local instance, or a hosted database (e.g. a free [Supabase](https://supabase.com) project)
- *(Optional)* A [Cloudinary](https://cloudinary.com) account — only needed for file-upload questions in custom forms
- *(Optional)* A Google Cloud OAuth Client ID — only needed for "Continue with Google" (see below)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/tanishak00000007777/Hackforge.git
cd Hackforge
```

### 2. Backend setup

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL and SECRET_KEY. Add AI_GROQ_API_KEY and/or AI_GEMINI_API_KEY for live Studio AI.
# GOOGLE_CLIENT_ID and Cloudinary credentials are optional unless those features are enabled.

# Run all migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload
```

The backend runs at `http://localhost:8000`:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health check:** `http://localhost:8000/health`

### 3. Frontend setup (main app)

```bash
cd FrontEnd/hackforge-react
npm install

# Configure environment
cp .env.example .env
# Open .env and fill in VITE_GOOGLE_CLIENT_ID if you want Google Sign-In to work

npm run dev
```

Runs at `http://127.0.0.1:5174`.

### 4. Website Studio

Studio is part of the main frontend build. No second install, iframe, `VITE_STUDIO_URL`, or port `4175` process is used. See [STUDIO_INTEGRATION.md](STUDIO_INTEGRATION.md).

---

## Environment Variables

### Backend — `.env` (repo root)

| Variable | Required | Purpose |
|---|---|---|
| `SECRET_KEY` | Yes | Signs JWTs — use a long random string, never the placeholder, in any real deployment |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:password@host:5432/dbname` — local Postgres or hosted (e.g. Supabase) |
| `GOOGLE_CLIENT_ID` | For Google login | Must match the frontend's `VITE_GOOGLE_CLIENT_ID` — validates the token's audience |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | No | JWT tuning, sensible defaults provided |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of frontend origins allowed by CORS |
| `FRONTEND_URL` | Yes | Where the backend redirects browser hits on `/`, `/login`, etc. |
| `AI_GROQ_API_KEY` and/or `AI_GEMINI_API_KEY` | For live Studio AI | Server-only provider credentials; never expose these through `VITE_*` variables |
| `AI_GROQ_MODEL`, `AI_GEMINI_MODEL` | No | Provider model overrides |
| `AI_REQUEST_TIMEOUT_SECONDS`, `AI_REQUESTS_PER_MINUTE`, `AI_MAX_TOKENS` | No | AI timeout, per-user request limit, and response budget |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | For form file uploads | Only required if a form has a file-upload question |

`AI_REQUESTS_PER_MINUTE` is enforced in memory per API process. A multi-worker deployment needs a shared rate limiter if the limit must apply across every worker.

### Frontend — `FrontEnd/hackforge-react/.env`

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend base URL, e.g. `http://localhost:8000/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | For Google login | Same Client ID as the backend's `GOOGLE_CLIENT_ID` |
| `VITE_ENABLE_DEV_MOCKS` | No | See [Dev login bypass](#dev-login-bypass) below — leave unset unless you want it |

> ⚠️ Never commit `.env`. Only commit `.env.example`. Both are already covered by `.gitignore`.

### Current frontend audit note

As of 2026-07-30, `npm audit --omit=dev` reports two high-severity findings through `react-router-dom@7.18.2` for a React Router Server Components CSRF issue. HackForge uses a client-side `BrowserRouter` SPA and does not enable React Router's Server Components mode. No fixed release is currently published; keep this visible in release review and upgrade when a fixed version becomes available instead of automatically downgrading to npm's suggested older release.

### Setting up Google Sign-In (optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure it (External, add yourself as a test user if in Testing mode).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add the URL your frontend runs on (e.g. `http://localhost:5174`).
5. Copy the generated **Client ID** into both `GOOGLE_CLIENT_ID` (backend `.env`) and `VITE_GOOGLE_CLIENT_ID` (frontend `.env`) — same value in both, no secret needed for this flow.
6. Restart both dev servers (env vars are only read at startup).

---

## Database

Every table has `id` (UUID), `created_at`, `updated_at` via a shared base model.

| Table | What it stores |
|---|---|
| `users` | All users — organizers, participants, judges |
| `organizations` | The college/company/team that owns hackathons |
| `hackathons` | Hackathon events, including `website_config` for the public microsite |
| `website_versions` | Versioned website project snapshots, including the currently published snapshot |
| `registrations` | Who registered for which hackathon, plus custom form answers |
| `teams` / `team_members` | Teams within a hackathon and their membership |
| `tracks` | Problem tracks (e.g. AI, Web3, Sustainability) |
| `submissions` | Project submissions from teams |
| `judges` | Which users are judges for which hackathon |
| `rubric_criteria` / `scores` | Organizer-defined scoring criteria and judges' scores |
| `certificates` / `certificate_templates` | Certificate templates and issued certificates with a verification ID |
| `announcements` | Organizer updates to participants |
| `hackathon_features` | Per-hackathon on/off toggles for optional modules |
| `custom_forms`, `form_questions`, `form_responses`, `form_answers`, `form_attachments` | The custom form builder |

### Alembic commands

```bash
# After changing any SQLAlchemy model, generate a migration
alembic revision --autogenerate -m "describe the change"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Inspect history / current version
alembic history
alembic current
```

---

## API Overview

Full request/response schemas are self-documented at `/docs` (Swagger) once the server is running — that's the source of truth. Rough shape of what's available:

| Module | Prefix | Notes |
|---|---|---|
| Auth | `/api/v1/auth` | Register, login, Google login |
| Organizations | `/api/v1/organizations` | Create org, list my orgs |
| Hackathons | `/api/v1/hackathons` | CRUD, owner-managed website config, publishing, versions, public listing, and published website snapshots |
| AI | `/api/v1/ai` | Owner-protected Studio canvas generation and copilot requests |
| Tracks | `/api/v1/tracks` | Problem tracks per hackathon |
| Registrations | `/api/v1/registrations` | Register, list, approve/reject/waitlist |
| Teams | `/api/v1/teams` | Create, join by invite code, leave |
| Submissions | `/api/v1/submissions` | Create, update, finalize, list |
| Judges & Scores | `/api/v1/judges`, `/api/v1/scores` | Invite/accept judges, rubric, scoring |
| Leaderboard | `/api/v1/leaderboard` | Ranked results per hackathon |
| Certificates | `/api/v1/certificates` | Template config, bulk issue, PDF download, public verification |
| Announcements | `/api/v1/announcements` | Organizer → participant updates |
| Analytics | `/api/v1/analytics` | Event-level stats |
| Feature toggles | `/api/v1/hackathons/{id}/features` | Enable/disable modules per hackathon |
| Forms | `/api/v1/forms` | Custom form builder, public submission, response grading |
| Sponsors, Users | `/api/v1/sponsors`, `/api/v1/users` | Routers scaffolded, not yet implemented |

Public endpoints (no auth) include the health check, published hackathon listing/detail by slug, `GET /api/v1/hackathons/public/{hackathon_id}/website`, public form view/submit, and certificate verification. Everything else requires `Authorization: Bearer <access_token>`.

---

## Authentication model

- **Email/password**: `POST /auth/register` then `POST /auth/login` → JWT access + refresh token.
- **Google**: frontend gets a Google ID token via Google Identity Services, posts it to `POST /auth/google`. If the email isn't registered yet, the backend returns `USER_NOT_REGISTERED` and the frontend prompts for a role (participant/organizer) before creating the account.
- Tokens are stored client-side (Zustand store) and attached as a Bearer header on every request.

### Dev login bypass

For local development only, `FrontEnd/hackforge-react` supports a shortcut login: enter **any email** and the password **`dev`**. It logs you straight in with a role inferred from the email (containing `"participant"` or `"judge"`, otherwise `"organizer"`) — no backend round-trip.

It only activates when **both** are true:
- The app is running in a Vite dev build (`import.meta.env.DEV`)
- `VITE_ENABLE_DEV_MOCKS=true` is set in `FrontEnd/hackforge-react/.env`

It's off by default and compiled out of production builds either way — never set that flag in a deployed environment's config.

---

## Team rules

1. **Routers never touch the database** — router calls service, service calls DB.
2. **Never store plaintext passwords** — always `hash_password()` before saving.
3. **Never return `hashed_password`** in any response — use the `UserResponse` schema.
4. **Never commit `.env`** — only commit `.env.example`.
5. **Import every new model** in `app/models/__init__.py`, or Alembic won't detect it.
6. **Run a migration after every model change** — never edit tables manually in the database.
7. **Same error for wrong email and wrong password** — never reveal which one failed.

---

## Deployment

`railway.json` is configured for [Railway](https://railway.app): it runs `alembic upgrade head` before each deploy, starts the API with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and health-checks `/health`. Point `DATABASE_URL`, `SECRET_KEY`, `GOOGLE_CLIENT_ID`, `ALLOWED_ORIGINS`, and `FRONTEND_URL` at your production values via Railway's environment variables. Add at least one server-side AI provider key when live Studio AI is enabled, and never reuse local development secrets.
