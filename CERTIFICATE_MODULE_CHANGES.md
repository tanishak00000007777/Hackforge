# Certificate Module Implementation Changes

## Summary

HackForge now provides organizer-designed certificates, bulk issuance, participant PDF downloads, and public verification. One editable design applies to every certificate issued for a hackathon.

## Certificate Templates

Each hackathon can store one template with:

- Preset: `classic`, `modern`, or `bold`
- Primary and secondary six-digit hexadecimal colors
- Heading and presentation wording
- Signatory name and title
- Up to eight manually entered sponsor names
- The hackathon's existing logo when it can be loaded safely

Template changes affect newly generated PDFs for existing certificates. They do not replace the original issue date or verification ID.

## Database and Migration

Migration `8c5f7c8d9e10_extend_certificate_module.py`:

- Removes pre-existing duplicate certificate rows before adding the constraint.
- Adds uniqueness for `(hackathon_id, user_id, type)`.
- Adds the `certificate_templates` table with one template per hackathon.
- Keeps template and certificate records linked to their hackathon with cascades.

Migration `d0a4c7e2b981_merge_features_forms_certificates.py` merges the form/certificate work with the other active migration branch.

## Bulk Issuance

| Certificate type | Eligible recipients |
| --- | --- |
| `participant` | Every approved hackathon registration |
| `judge` | Every accepted hackathon judge |
| `winner` | Members of organizer-selected teams |
| `runner_up` | Members of organizer-selected teams |

Bulk issuance is idempotent. Existing recipient/type certificates are skipped and the API returns `issued`, `skipped`, and `total` counts. Empty recipient groups, missing award-team selections, and teams belonging to another hackathon are rejected.

## PDF Generation

ReportLab generates landscape A4 PDFs in memory when previewed or downloaded. PDFs include:

- Selected preset and colors
- Editable heading and body wording
- Recipient name
- Hackathon title
- Certificate type wording
- Issue date
- Signatory and sponsors
- Hackathon logo when a bounded HTTPS image request succeeds
- Verification ID
- QR code linking to the public verification page

Logo requests have a four-second timeout, do not follow redirects, accept only image responses, and stop at 2 MB. A missing or invalid logo does not prevent PDF generation.

## Backend APIs

All routes are under `/api/v1`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/certificates/hackathons/{hackathon_id}/template` | Load the active template |
| `PUT` | `/certificates/hackathons/{hackathon_id}/template` | Save the active template |
| `POST` | `/certificates/hackathons/{hackathon_id}/template/preview` | Generate a PDF from unsaved settings |
| `POST` | `/certificates/hackathons/{hackathon_id}/issue-bulk` | Issue certificates to an eligible group |
| `GET` | `/certificates/hackathons/{hackathon_id}/issued` | List issued certificates for the organizer |
| `GET` | `/certificates/me` | List the current participant's certificates |
| `GET` | `/certificates/verify/{verification_id}` | Publicly verify a certificate |
| `GET` | `/certificates/{certificate_id}/pdf` | Download an authorized certificate PDF |

Template management, organizer lists, and bulk issuance require the hackathon owner or an admin. PDF downloads require the recipient, hackathon owner, or admin. Public verification returns only the recipient name, event title, type, issue date, verification ID, and validity.

## Frontend Interfaces

- `/organizer/certificates`
  - Select a hackathon.
  - Choose Classic, Modern, or Bold.
  - Edit colors, text, signatory, and sponsors.
  - View an in-page design preview.
  - Open a generated PDF preview.
  - Select bulk recipient type and award teams.
  - Review issued/skipped counts and issued certificates.
  - Download organizer-authorized PDFs.
- `/participant/certificates`
  - View issued certificate cards.
  - Download authenticated PDFs.
  - Open public verification links.
- `/certificates/verify/:verificationId`
  - Display a responsive public valid/not-valid result without exposing email or internal user IDs.
- Organizer and participant dashboards now contain Certificates navigation.

## Development-Mode PDF Fixes

Development login uses local API mocks. The original certificate mock returned plain text labeled as a PDF, which caused Chrome's `Failed to load PDF document` error. The mock now creates a structurally valid PDF with object offsets and cross-reference data.

The mock preview was then expanded from a one-line placeholder into a complete certificate containing the editable template, recipient, event, award wording, signatory, sponsors, date, verification ID, and preset-specific decorations. Mock downloads reuse the saved hackathon template and issued recipient details.

## Configuration and Dependencies

```env
FRONTEND_URL=http://localhost:4174
```

`FRONTEND_URL` is used to create certificate verification links. ReportLab is pinned in `requirements.txt`. Certificates are generated on demand and are not stored in Cloudinary.

## Main Files

- `app/models/certificate.py`
- `app/schemas/certificate.py`
- `app/routers/certificates.py`
- `app/services/certificate_service.py`
- `alembic/versions/8c5f7c8d9e10_extend_certificate_module.py`
- `alembic/versions/d0a4c7e2b981_merge_features_forms_certificates.py`
- `FrontEnd/hackforge-react/src/pages/CertificatesDashboard.jsx`
- `FrontEnd/hackforge-react/src/pages/MyCertificatesPage.jsx`
- `FrontEnd/hackforge-react/src/pages/CertificateVerifyPage.jsx`
- `FrontEnd/hackforge-react/src/services/certificateApi.js`
- `FrontEnd/hackforge-react/src/services/apiClient.js`

## Verification

- All three presets generate `%PDF` documents larger than the minimum test size.
- Tests confirm that template changes alter regenerated PDFs.
- Invalid colors and excessive sponsor lists are rejected.
- The development PDFs pass header, object, cross-reference, and required-content checks.
- Nine certificate tests pass.
- The main React lint and production build complete without errors.

## Current Scope Boundaries

Individual issuance UI, email delivery, revocation, signature-image uploads, background-art uploads, batch ZIP downloads, and blockchain/NFT certificates are not included.
