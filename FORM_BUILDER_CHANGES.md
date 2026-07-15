# Form Builder Implementation Changes

## Summary

HackForge now includes Google Forms-style forms for hackathon submissions and manually graded quizzes. Organizers can build and publish forms, respondents can submit through a shareable page, and published forms can be embedded in Studio exports.

## Supported Form Features

- Purposes: `submission` and `quiz`.
- Access modes: `public` and `authenticated`.
- States: `draft`, `published`, and `closed`.
- Question types:
  - Short answer
  - Paragraph
  - Multiple choice
  - Checkboxes
  - Single-file upload
- Required questions, ordered questions, question descriptions, options, and quiz point limits.
- Multiple responses from anonymous or authenticated respondents.
- Manual per-answer quiz scoring, answer feedback, overall feedback, grader identity, grading time, and derived total score.

## Database and Migration

Migration `54f2c8a91e73_add_custom_forms.py` adds:

- `custom_forms`
- `form_questions`
- `form_responses`
- `form_answers`
- `form_attachments`

Important constraints include unique public slugs, unique question positions within a form, one answer per response/question pair, and one attachment per file answer. Form records use database cascades where appropriate, while deleted submitter or grader accounts are retained as nullable references.

## Backend APIs

All routes are under `/api/v1`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/forms/public/{slug}` | Load a published or closed public form |
| `POST` | `/forms/public/{slug}/responses` | Submit multipart answers and files |
| `POST` | `/forms/hackathons/{hackathon_id}` | Create an organizer-owned form |
| `GET` | `/forms/hackathons/{hackathon_id}` | List forms for an owned hackathon |
| `GET` | `/forms/manage/{form_id}` | Load a form for editing |
| `PATCH` | `/forms/manage/{form_id}` | Update form settings |
| `PUT` | `/forms/manage/{form_id}/questions` | Replace and reorder questions |
| `POST` | `/forms/manage/{form_id}/publish` | Publish a form |
| `POST` | `/forms/manage/{form_id}/close` | Close a form |
| `DELETE` | `/forms/manage/{form_id}` | Delete an empty draft |
| `GET` | `/forms/manage/{form_id}/responses` | List organizer-visible responses |
| `GET` | `/forms/response-records/{response_id}` | Inspect one response |
| `PATCH` | `/forms/response-records/{response_id}/grade` | Grade a quiz response |
| `GET` | `/forms/attachment-files/{attachment_id}/download` | Obtain an authorized private attachment download |

Organizer operations verify hackathon ownership. Authenticated forms reject anonymous submissions, draft forms are not publicly visible, and closed forms reject new responses.

## Multipart Submission and Validation

- The `answers` multipart field contains a JSON object keyed by question ID.
- Upload fields use `file_{question_id}`.
- Unknown questions, malformed JSON, invalid choices, incorrect value types, missing required values, duplicate file fields, and files sent to non-file questions are rejected.
- The browser displays validation and server errors next to the Submit button.
- While sending, the button changes to `Submitting...` and cannot be submitted again.
- A successful request shows `Response sent successfully`, confirms that the response was recorded, and offers `Submit another response`.

## Cloudinary Upload Flow

- Files always pass through FastAPI; credentials are never sent to the frontend.
- Maximum size is 10 MB for one file and 50 MB across one response.
- Files are uploaded with `resource_type="auto"`, private delivery, unique generated identifiers, and no overwrite.
- Assets are stored under `hackforge/forms/{form_id}/{response_id}`.
- PostgreSQL stores only Cloudinary identifiers and file metadata.
- Organizer downloads use signed private URLs that expire after five minutes.
- Upload failure rolls back the response transaction.
- Database failure after an upload destroys uploaded assets with CDN invalidation.

Required backend settings:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

The Cloudinary Python SDK is pinned in `requirements.txt`.

## Frontend Interfaces

- `/organizer/forms` lists forms and creates new forms for a selected hackathon.
- `/organizer/forms/:formId` provides authoring, question management, publishing, response review, and quiz grading.
- `/forms/:slug` is the responsive canonical form page.
- The organizer dashboard contains Forms navigation.
- The API client supports `FormData` without forcing `Content-Type: application/json`.
- Development mode includes local form and response mocks backed by `localStorage`.

## Studio Form Embed

Studio now includes a `Form Embed` section with:

- Published form URL
- Embed height
- Background color
- Top and bottom spacing

The editor preview renders the canonical form page in an iframe. JSON projects preserve the section, and generated React exports include the iframe URL and configured height.

## Main Files

- `app/models/form.py`
- `app/schemas/form.py`
- `app/routers/forms.py`
- `app/services/form_service.py`
- `app/services/cloudinary_service.py`
- `alembic/versions/54f2c8a91e73_add_custom_forms.py`
- `FrontEnd/hackforge-react/src/pages/FormsDashboard.jsx`
- `FrontEnd/hackforge-react/src/pages/FormBuilderPage.jsx`
- `FrontEnd/hackforge-react/src/pages/PublicFormPage.jsx`
- `FrontEnd/hackforge-react/src/services/formApi.js`
- `FrontEnd/hackforge-react/src/services/apiClient.js`
- `FrontEnd/EditorWindow/Editor window/hackforge-studio/src/builder/sections/formEmbed/`

## Verification

- Form answer validation tests cover text trimming, invalid multiple-choice options, and checkbox deduplication.
- The public submit flow includes required-answer checks, per-file size checks, total upload checks, success confirmation, repeated submission, and visible error handling.
- The main React production build passes.

## Current Scope Boundaries

Automatic grading, branching logic, response editing, autosave, email receipts, CSV exports, direct browser-to-Cloudinary uploads, and submitter-visible quiz results are not included.
