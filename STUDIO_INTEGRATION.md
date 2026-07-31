# Lovable Canvas integration

HackForge remains the primary application. Its navigation, authentication, organizer routes, dashboards, branding, and all non-editor screens stay in FrontEnd/hackforge-react.

The Lovable working environment is vendored at FrontEnd/hackforge-react/src/lovable-canvas with its visual hierarchy, spacing, layout, components, and interactions preserved. Only the session, persistence, AI, and publishing adapters were changed. It is mounted only at:

    /organizer/hackathons/:hackathonId/studio

The editor is lazy-loaded on the main frontend origin. LovableStudioHost.jsx passes the authenticated HackForge session directly to the canvas; no access token is placed in a URL and no second Studio server or iframe bridge is required.

## Active structure

| Path | Responsibility |
| --- | --- |
| app/ | FastAPI, authentication, owner checks, PostgreSQL persistence, AI proxy, publishing, and immutable published versions |
| FrontEnd/hackforge-react/ | Primary HackForge application and routing |
| FrontEnd/hackforge-react/src/lovable-canvas/ | Lovable editor UI with preserved visual and layout fidelity: header, sidebar, canvas, inspector, code modal, and publish modal |
| FrontEnd/hackforge-react/src/pages/studio/LovableStudioHost.jsx | Session adapter between HackForge and Lovable Canvas |
| FrontEnd/hackforge-react/src/pages/PublishedCanvasPage.tsx | Public renderer for the immutable published snapshot |
| FrontEnd/EditorWindow/ | Preserved legacy Studio source; not used by the active route |

## APIs

| Method and path | Access | Purpose |
| --- | --- | --- |
| GET /api/v1/hackathons/manage/{hackathon_id} | Owner | Load event metadata and the saved canvas |
| PATCH /api/v1/hackathons/{hackathon_id}/website-config | Owner | Validated serialized autosave |
| POST /api/v1/ai/canvas-generate | Owner, per-process rate limited | Lovable full-site/component generation with provider fallback |
| POST /api/v1/hackathons/{hackathon_id}/publish | Owner | Save an immutable published version and mark the event published |
| GET /api/v1/hackathons/public/{hackathon_id}/website | Public | Return only the immutable published snapshot |
| GET /api/v1/hackathons/{hackathon_id}/versions | Owner | List saved versions |
| POST /api/v1/hackathons/{hackathon_id}/versions | Owner | Create a manual checkpoint |
| GET /api/v1/hackathons/{hackathon_id}/versions/{version_id} | Owner | Read one version |
| POST /api/v1/hackathons/{hackathon_id}/versions/{version_id}/restore | Owner | Restore a version |

The source Lovable package contained only /api/health and an unauthenticated /api/generate-component. Its AI behavior was ported to the protected FastAPI route. HackForge's existing health endpoint remains /health.

The current AI request limiter is in memory and applies per user within one API process. Use a shared limiter before running multiple workers if the quota must be global.

## Stored document

The canvas document needs no new column. Autosave uses the existing hackathons.website_config JSONB column:

~~~json
{
  "schemaVersion": 1,
  "components": [],
  "pages": [
    {
      "id": "lovable-home",
      "name": "Home",
      "path": "/",
      "components": []
    }
  ],
  "currentPageId": "lovable-home",
  "globalTheme": {
    "editor": "lovable-canvas",
    "canvasBackground": "dot"
  },
  "assets": [],
  "device": "desktop"
}
~~~

Publishing copies that document to the existing website_versions.project JSONB column. Later autosaves change only the draft; the public route continues serving the published version.

Database migration already required by publishing:

    401b57c4c144_add_website_versions.py

## Environment variables

Backend .env:

| Variable | Required | Purpose |
| --- | --- | --- |
| SECRET_KEY | Yes | JWT signing; replace the example value in production |
| DATABASE_URL | Yes | PostgreSQL connection |
| ALLOWED_ORIGINS | Yes | Exact frontend origins |
| FRONTEND_URL | Yes | Primary HackForge frontend |
| GOOGLE_CLIENT_ID | For Google login | OAuth audience |
| AI_GROQ_API_KEY and/or AI_GEMINI_API_KEY | For live AI | Server-only AI providers |
| AI_GROQ_MODEL, AI_GEMINI_MODEL | No | Provider model overrides |
| AI_REQUEST_TIMEOUT_SECONDS | No | AI timeout |
| AI_REQUESTS_PER_MINUTE | No | Per-user generation limit |
| AI_MAX_TOKENS | No | AI response budget |
| CLOUDINARY_* | For form uploads | Existing form attachment storage |

Frontend FrontEnd/hackforge-react/.env:

| Variable | Required | Purpose |
| --- | --- | --- |
| VITE_API_BASE_URL | Production | FastAPI base ending in /api/v1; development uses the same-origin Vite proxy |
| VITE_GOOGLE_CLIENT_ID | For Google login | Must match backend OAuth configuration |
| VITE_ENABLE_DEV_MOCKS | No | Keep false outside deliberate local mock work |

Provider credentials must never use a VITE_ prefix. The imported source contained an exposed provider key in both server.ts and .env.example; those copies were removed. Rotate or revoke that credential because source exposure cannot be undone locally.

## Added frontend dependencies

- react-grid-layout: the Lovable 12-column drag/resize canvas.
- canvas-confetti: the existing Lovable publish-success animation.

React, Lucide, Tailwind, and Vite were already present. The unused source-only motion package was not copied, nor was the source Express/@google/genai server stack.

## Local run

~~~powershell
# Backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Primary frontend, including Lovable Canvas
Set-Location FrontEnd\hackforge-react
npm install
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
~~~

There is no port 4175 service. Open:

    http://127.0.0.1:5174/organizer/hackathons/{hackathon_id}/studio

## Release checks

~~~powershell
python -m pytest tests -q

Set-Location FrontEnd\hackforge-react
npm run lint
npm run build
npm audit --omit=dev
~~~

As of 2026-07-30, the frontend audit reports two high-severity findings for a React Router Server Components CSRF issue. This application is a `BrowserRouter` SPA and does not enable that mode. No fixed release is currently published; retain the audit check and upgrade when one becomes available rather than automatically downgrading.

Then verify organizer ownership, edit/autosave/reload, AI generation, publish, the public /sites/{hackathon_id}/{slug} view, non-owner 404, unpublished public 404, and absence of provider keys in generated bundles.

## Source limitations

The supplied Lovable export did not contain authentication, a database, uploads, realtime, sessions, notifications, search, queues, or deployment infrastructure. Those capabilities cannot be extracted from files that are absent. The integration therefore preserves the actual Lovable editor UI and interactions while using HackForge's existing backend for authentication, authorization, persistence, and versioned publishing.
