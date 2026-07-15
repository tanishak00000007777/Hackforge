# Recent HackForge Changes Summary

## Completed Features and Fixes

### Form Builder

- Added PostgreSQL models and migrations for forms, questions, responses, answers, grades, and attachment metadata.
- Added organizer authoring, publishing, response review, and manual quiz grading.
- Added responsive public and authenticated form submission pages.
- Added private Cloudinary uploads with size limits, rollback cleanup, and authorized signed downloads.
- Fixed the Submit button flow so it shows progress, a clear success confirmation, repeated-response support, and visible validation/server errors.
- Added a Studio `Form Embed` section and generated React iframe export support.

See [FORM_BUILDER_CHANGES.md](FORM_BUILDER_CHANGES.md) for the complete implementation record.

### Certificate Module

- Added one editable certificate template per hackathon.
- Added Classic, Modern, and Bold designs.
- Added idempotent bulk issuance for participants, judges, winners, and runners-up.
- Added landscape A4 ReportLab PDFs with event details, sponsors, signatory, logo fallback, verification IDs, and QR links.
- Added organizer certificate management, participant certificate cards/downloads, and public verification.
- Fixed invalid development PDF blobs and replaced the one-line placeholder with a complete styled mock certificate.

See [CERTIFICATE_MODULE_CHANGES.md](CERTIFICATE_MODULE_CHANGES.md) for the complete implementation record.

### Studio and Navigation

- Reduced sidebar and inspector widths and tightened spacing to give the canvas more room.
- Removed repeated promotional panels and duplicate toolbar actions.
- Preserved editing, responsive device controls, preview, history, import/export, save, and section management.
- Changed the organizer `Create Event` action to open Studio instead of showing an alert.
- Added configurable `VITE_STUDIO_URL` handling for local and deployed environments.

See [STUDIO_UI_CHANGES.md](STUDIO_UI_CHANGES.md) for the Studio cleanup details.

### API Client and Development Mode

- Added blob response support for authenticated PDF previews and downloads.
- Added multipart `FormData` support without forcing a JSON content type.
- Added local development mocks for forms, responses, templates, issued certificates, verification, and complete PDFs.
- Added structured user-facing success and error states to the new pages.

## New Frontend Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/organizer/forms` | Organizer/admin | List and create forms |
| `/organizer/forms/:formId` | Organizer/admin | Build, publish, review, and grade |
| `/forms/:slug` | Public or sign-in required | Fill and submit a form |
| `/organizer/certificates` | Organizer/admin | Design and issue certificates |
| `/participant/certificates` | Participant | View and download certificates |
| `/certificates/verify/:verificationId` | Public | Verify a certificate |

## New Backend Dependencies

- `cloudinary==1.45.0`
- `reportlab==4.4.9`

## New Environment Settings

Backend:

```env
FRONTEND_URL=http://localhost:4174
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Main React frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_STUDIO_URL=http://127.0.0.1:4175/studio/
```

Secrets remain backend-only.

## Database Migrations

Apply migrations before testing against PostgreSQL:

```powershell
alembic upgrade head
```

Feature migrations:

- `54f2c8a91e73_add_custom_forms.py`
- `8c5f7c8d9e10_extend_certificate_module.py`
- `d0a4c7e2b981_merge_features_forms_certificates.py`

## Local Development

Backend:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Main frontend:

```powershell
cd FrontEnd/hackforge-react
npm run dev -- --host 127.0.0.1 --port 4174
```

Studio:

```powershell
cd "FrontEnd/EditorWindow/Editor window/hackforge-studio"
npm run dev -- --host 127.0.0.1 --port 4175
```

Local URLs:

- Main app: `http://127.0.0.1:4174/`
- Studio: `http://127.0.0.1:4175/studio/`
- API documentation: `http://127.0.0.1:8000/docs`
- Backend health: `http://127.0.0.1:8000/health`

## Verification Completed

- Backend certificate and form validation tests pass.
- Certificate output was checked for all three presets.
- Development PDFs were checked for valid PDF structure and expected certificate content.
- Main React lint and production build complete without errors; unrelated existing lint warnings remain.
- Studio lint/build and browser layout checks are recorded in `STUDIO_UI_CHANGES.md`.
- Backend, main frontend, and Studio local endpoints returned HTTP 200 during the run check.

## Documentation Index

- [PROJECT_CHANGES_SUMMARY.md](PROJECT_CHANGES_SUMMARY.md) — recent work overview and local setup
- [FORM_BUILDER_CHANGES.md](FORM_BUILDER_CHANGES.md) — full forms and Cloudinary implementation
- [CERTIFICATE_MODULE_CHANGES.md](CERTIFICATE_MODULE_CHANGES.md) — full certificate implementation and PDF fixes
- [STUDIO_UI_CHANGES.md](STUDIO_UI_CHANGES.md) — Studio decluttering and layout cleanup
- [IMPLEMENTATION_CHANGES.md](IMPLEMENTATION_CHANGES.md) — earlier frontend/backend integration work

Generated `__pycache__` files are runtime artifacts and are not intentional source changes.
