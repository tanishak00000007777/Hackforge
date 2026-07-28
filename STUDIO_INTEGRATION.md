# HackForge Studio Integration

## Architecture

HackForge runs as three deployable services:

1. `app/` is the FastAPI API and PostgreSQL persistence layer.
2. `FrontEnd/hackforge-react/` owns login, organizer authorization, and event selection.
3. `FrontEnd/EditorWindow/` is the visual website editor served below `/studio/`.

The access token is never placed in a query string. The organizer app embeds Studio and sends the token with `window.postMessage` to the exact configured Studio origin. Studio keeps that session in `sessionStorage`, loads only an organizer-owned hackathon, and saves the project to `hackathons.website_config`.

## Routes

| Route | Purpose |
| --- | --- |
| `/organizer` | Organizer dashboard and hackathon selection |
| `/organizer/hackathons/:hackathonId/studio` | Role-protected Studio bridge |
| `/studio/?hackathonId=:hackathonId` | Event-specific editor |
| `GET /api/v1/hackathons/manage/:hackathonId` | Owner-checked event load |
| `PATCH /api/v1/hackathons/:hackathonId/website-config` | Validated project save |
| `POST /api/v1/hackathons/:hackathonId/publish` | Owner-checked publish |

## Local Setup

1. Start PostgreSQL and create the `hackforge` database.
2. Configure the backend `.env`:

   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/hackforge
   ALLOWED_ORIGINS=http://127.0.0.1:5174,http://localhost:5174,http://127.0.0.1:4175,http://localhost:4175
   FRONTEND_URL=http://127.0.0.1:5174
   ```

3. Start the backend:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

4. Start the organizer frontend:

   ```powershell
   cd FrontEnd\hackforge-react
   npm ci
   npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
   ```

5. Start Studio:

   ```powershell
   cd FrontEnd\EditorWindow
   npm ci
   npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
   ```

6. Sign in as an organizer, open `/organizer`, select an owned hackathon, and choose **Open Website Studio**.

## Production Configuration

Backend:

```env
DATABASE_URL=postgresql+asyncpg://...
ALLOWED_ORIGINS=https://app.example.com,https://studio.example.com
FRONTEND_URL=https://app.example.com
DEBUG=false
```

Organizer frontend:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_STUDIO_URL=https://studio.example.com/studio/
VITE_ENABLE_DEV_MOCKS=false
```

Studio:

```env
VITE_APP_ORIGIN=https://app.example.com
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Deploy the API first, then the organizer frontend, then Studio. The Studio Railway health endpoint is `/studio/`. All origins must include the exact scheme and host, without paths.

## Release Checks

Run before deployment:

```powershell
python -m pytest tests -q

cd FrontEnd\hackforge-react
npm run lint
npm run build

cd ..\EditorWindow
npm test
npm run lint
npm run build
```

Then verify:

1. An organizer can open an owned event in Studio.
2. A different event ID returns `404` and does not reveal ownership.
3. Editing shows `Saving`, then `Saved`.
4. Reloading Studio restores the server-saved project.
5. Publish changes the hackathon status and reports backend failures instead of simulated success.
6. The browser URL and logs contain no access token.
