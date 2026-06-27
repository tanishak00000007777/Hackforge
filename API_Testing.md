# HackForge Backend API Testing

## Environment

- Backend: FastAPI
- Database: Supabase PostgreSQL
- Authentication: JWT Bearer
- API Documentation: Swagger UI

---

# Testing Status

| Module | Endpoint | Status |
|---------|----------|--------|
| Register | POST /api/v1/auth/register | ✅ |
| Login | POST /api/v1/auth/login | ✅ |
| Create Organization | POST /api/v1/organizations | ✅ |
| Get My Organizations | GET /api/v1/organizations/me | ✅ |

---

# Test Cases
## 1. Register User

### Endpoint

POST /api/v1/auth/register

### Objective

Verify that a new user can register successfully.

### Test Data

```json
{
  "email": "gursharen@example.com",
  "full_name": "Gursharen Kaur Suri",
  "password": "Password@123",
  "role": "participant"
}
```

### Expected Result

- Status Code: 201 Created
- User inserted into database
- Password hashed
- UUID generated

### Actual Result

✅ Passed


### Validation Performed

- [x] User created
- [x] Password hidden
- [x] UUID generated
- [x] Database updated

---

## Negative Tests

### Duplicate Registration

Input

```json
{
  "email": "gursharen@example.com",
  "full_name": "Another User",
  "password": "Password@123",
  "role": "participant"
}
```

Expected

409 Conflict

Actual

✅ Passed

---

### Invalid Login Password

Expected

401 Unauthorized

Actual

✅ Passed

---


## 2. Login

### Endpoint

POST /api/v1/auth/login

### Objective

Authenticate an existing user.

### Test Data

```json
{
  "email": "gursharen@example.com",
  "password": "Password@123"
}
```

### Expected

- JWT Access Token
- JWT Refresh Token
- HTTP 200

### Actual

✅ Passed

### Validation

- [x] Token generated
- [x] Token accepted by Swagger

---

## 3. Create Organization

### Endpoint

POST /api/v1/organizations/

### Objective

Create an organization for the authenticated organizer.

### Authentication

Bearer Token Required

### Test Data

```json
{
  "name": "HackForge Organization",
  "slug": "hackforge-org",
  "description": "Organization for hosting hackathons and technical events.",
  "website_url": "https://hackforge.dev"
}
```

### Expected

- HTTP 201
- Organization created
- owner_id equals logged in user

### Actual

✅ Passed

### Validation

- [x] Organization inserted
- [x] owner_id assigned
- [x] UUID generated

---

## Negative Tests

### Unauthorized Organization Creation

Expected

401 Unauthorized

Actual

✅ Passed

---

# 4. Create Hackathon

## Endpoint

**Method:** `POST`

**Route**

```text
/api/v1/hackathons/{org_id}
```

---

## Objective

Verify that an authenticated organizer can successfully create a new hackathon under an existing organization.

---

## Authentication

**Required:** ✅ Yes

Authentication Method:

```
Bearer JWT Token
```

---

## Path Parameter

| Parameter | Value Used                             |
| --------- | -------------------------------------- |
| org_id    | Organization ID created during testing |

---

## Request Body

```json
{
  "title": "HackForge Summer Hackathon 2026",
  "slug": "hackforge-summer-2026",
  "tagline": "Build. Innovate. Inspire.",
  "description": "A 48-hour hackathon for developers, designers, and innovators.",
  "mode": "online",
  "max_participants": 500,
  "max_team_size": 4,
  "min_team_size": 2,
  "registration_mode": "open",
  "prize_pool": "₹1,00,000",
  "contact_email": "gursharen@example.com"
}
```

---

## Expected Result

* HTTP Status Code **201 Created**
* Hackathon record created in PostgreSQL.
* Organization ID linked correctly.
* UUID generated automatically.
* Default status should be **draft**.
* Response should contain hackathon details.

---

## Actual Result

✅ **Passed**

The API successfully created the hackathon and returned the created object with all expected fields.

---

## Validation Performed

* [x] Authentication verified
* [x] Organization ID accepted
* [x] UUID generated
* [x] Hackathon stored in database
* [x] Status initialized as `draft`
* [x] Response schema matched expected output

---

## Edge Cases Tested

| Test Case             | Expected   | Status |
| --------------------- | ---------- | ------ |
| Valid organization ID | Success    | ✅      |
| Valid JWT             | Authorized | ✅      |

---

# 5. Get Hackathon By Slug

## Endpoint

**Method:** `GET`

**Route:**

```text
/api/v1/hackathons/{slug}
```

---

## Objective

Verify that a hackathon can be retrieved successfully using its unique slug.

---

## Authentication

**Required:** ❌ No

This endpoint is publicly accessible and does not require a JWT Bearer Token.

---

## Path Parameter

| Parameter | Value Used              |
| --------- | ----------------------- |
| slug      | `hackforge-summer-2026` |

---

## Test Cases

### Test Case 1 – Valid Slug

**Request**

```http
GET /api/v1/hackathons/hackforge-summer-2026
```

**Expected Result**

* HTTP Status Code **200 OK**
* Returns the hackathon details matching the provided slug.
* All fields match the data created during the Create Hackathon API test.

**Actual Result**

✅ **Passed**

The API returned the correct hackathon details.

---

## Validation Performed

* [x] Existing slug successfully retrieves hackathon.
* [x] Returned object matches the created hackathon.
* [x] Correct organization association verified.
* [x] Response schema matches API specification.
* [x] Public endpoint accessible without authentication.

---

## Final Status

✅ **Passed**

---
# 6. Publish Hackathon

## Endpoint

**Method:** `POST`

**Route:**

```text
/api/v1/hackathons/{hackathon_id}/publish
```

---

## Objective

Verify that an organizer can publish an existing hackathon and change its status from `draft` to `published`.

---

## Authentication

**Required:** ✅ Yes

Bearer JWT Token obtained from the Login API.

---

## Path Parameter

| Parameter | Value Used |
|----------|------------|
| hackathon_id | `810d9866-f43a-4e4c-bdbc-c274dd9c6540` |

---

## Test Cases

### Test Case 1 – Invalid Hackathon ID

**Request**

```http
POST /api/v1/hackathons/3fa85f64-5717-4562-b3fc-2c963f66afa6/publish
Authorization: Bearer <JWT_TOKEN>
```

**Expected Result**

- HTTP Status Code **404 Not Found**
- Returns an appropriate error message indicating that the hackathon does not exist.

**Actual Result**

✅ Passed

```json
{
    "detail": "Hackathon not found"
}
```

---

### Test Case 2 – Valid Hackathon ID

**Request**

```http
POST /api/v1/hackathons/810d9866-f43a-4e4c-bdbc-c274dd9c6540/publish
Authorization: Bearer <JWT_TOKEN>
```

**Expected Result**

- HTTP Status Code **200 OK**
- Hackathon status changes from `draft` to `published`.
- Returns updated hackathon details.

**Actual Result**

✅ Passed

Response contained:

- Correct hackathon ID
- Correct organization ID
- Status updated to **published**
- Existing hackathon information remained unchanged

---

## Validation Performed

- [x] Authentication required.
- [x] Invalid Hackathon ID returns **404 Not Found**.
- [x] Existing hackathon published successfully.
- [x] Status changed from **draft** → **published**.
- [x] Returned data matches the created hackathon.
- [x] Response schema matches API specification.

---

## 7. Update `website-config`

### Description

Updates the website appearance and branding configuration of a hackathon.

This endpoint allows the organizer to configure:

* Banner Image
* Logo Image
* Primary Theme Color
* Secondary Theme Color

The configuration is stored in the `website_config` JSON field and synchronized with the standalone `banner_url` and `logo_url` database columns.

---

## Authentication

**Required**

```
Authorization: Bearer <JWT_TOKEN>
```

Only the hackathon creator can update the website configuration.

---

## Endpoint

```http
PATCH /api/v1/hackathons/{hackathon_id}/website-config
```

---

## Path Parameter

| Parameter      | Type | Description         |
| -------------- | ---- | ------------------- |
| `hackathon_id` | UUID | Unique Hackathon ID |

Example:

```
810d9866-f43a-4e4c-bdbc-c274dd9c6540
```

---

## Request Body

```json
{
    "banner_url": "https://picsum.photos/1200/300",
    "logo_url": "https://picsum.photos/200",
    "primary_color": "#2563EB",
    "secondary_color": "#0F172A"
}
```

---

## Expected Response

**Status Code**

```
200 OK
```

Example Response

```json
{
    "id": "810d9866-f43a-4e4c-bdbc-c274dd9c6540",
    "organization_id": "3923ba01-b5c9-42cc-ba0b-5fdda3110389",
    "title": "HackForge Summer Hackathon 2026",
    "slug": "hackforge-summer-2026",
    "tagline": "Build. Innovate. Inspire.",
    "mode": "online",
    "status": "published",
    "max_participants": 500,
    "max_team_size": 4,
    "min_team_size": 2,
    "registration_mode": "open",
    "banner_url": "https://picsum.photos/1200/300",
    "logo_url": "https://picsum.photos/200",
    "prize_pool": "₹1,00,000",
    "created_at": "2026-06-27T05:52:17.058811Z"
}
```

---

# Test Cases

## Test Case 1 — Valid Website Configuration Update

### Input

```json
{
    "banner_url": "https://picsum.photos/1200/300",
    "logo_url": "https://picsum.photos/200",
    "primary_color": "#2563EB",
    "secondary_color": "#0F172A"
}
```

### Expected Result

* Status Code: **200 OK**
* Website configuration updated successfully.
* Response contains updated `banner_url`.
* Response contains updated `logo_url`.

### Actual Result

* Received **200 OK**
* Configuration updated successfully.
* Response matched expected output.

**Status:** ✅ Passed

---

## Test Case 2 — Database Verification

### Query

```sql
SELECT
    title,
    website_config,
    banner_url,
    logo_url
FROM hackathons;
```

### Expected Result

* `website_config` updated.
* `banner_url` updated.
* `logo_url` updated.

### Actual Result

Verified successfully in Supabase.

**Status:** ✅ Passed

---

# Bug Found During Testing

### Issue

Initially, the API updated only the `website_config` JSON object.

The standalone database columns:

* `banner_url`
* `logo_url`

remained `NULL`, causing the API response to return:

```json
{
    "banner_url": null,
    "logo_url": null
}
```

even though the JSON configuration contained the correct values.

---

## Root Cause

The backend service only executed:

```python
hackathon.website_config = config
```

The standalone columns were never synchronized.

---

## Fix Applied

Updated the backend service:

```python
hackathon.website_config = config

hackathon.banner_url = config.get("banner_url")
hackathon.logo_url = config.get("logo_url")
```

---

## Verification After Fix

Re-tested the endpoint.

Observed:

* `website_config` updated successfully.
* `banner_url` updated correctly.
* `logo_url` updated correctly.
* API response matched database values.

**Status:** ✅ Bug Fixed

---

# Overall Result

| Test                  | Status   |
| --------------------- | -------- |
| Functional Testing    | ✅ Passed |
| Authentication        | ✅ Passed |
| Database Verification | ✅ Passed |
| Response Verification | ✅ Passed |
| Bug Fix Verification  | ✅ Passed |

---

# 8. Create Track

## Description

Creates a new track for a hackathon.

Tracks represent different competition categories within a hackathon (e.g., AI, Cyber Security, Web Development). Each track contains its own description, prize amount, and display order.

---

## Authentication

**Required**

```text
Authorization: Bearer <JWT_TOKEN>
```

Only the hackathon organizer can create tracks.

---

## Endpoint

```http
POST /api/v1/tracks/{hackathon_id}
```

---

## Path Parameter

| Parameter      | Type | Description           |
| -------------- | ---- | --------------------- |
| `hackathon_id` | UUID | Existing Hackathon ID |

Example

```text
810d9866-f43a-4e4c-bdbc-c274dd9c6540
```

---

## Request Bodies Used During Testing

### Track 1

```json
{
  "name": "Artificial Intelligence",
  "description": "AI and Machine Learning based solutions.",
  "prize": "₹50,000",
  "sort_order": 1
}
```

### Track 2

```json
{
  "name": "Cyber Security",
  "description": "Security, Privacy and Blockchain projects.",
  "prize": "₹40,000",
  "sort_order": 2
}
```

### Track 3

```json
{
  "name": "Web Development",
  "description": "Full Stack and Cloud based applications.",
  "prize": "₹30,000",
  "sort_order": 3
}
```

---

## Database Verification

```sql
SELECT *
FROM tracks
WHERE hackathon_id='810d9866-f43a-4e4c-bdbc-c274dd9c6540';
```

### Expected Result

Three tracks should be present in the database.

### Actual Result

Three tracks were successfully stored in Supabase.

**Status:** ✅ Passed

---

# 9. List Tracks

## Description

Retrieves all tracks associated with a specific hackathon.

---

## Authentication

Not Required

---

## Endpoint

```http
GET /api/v1/tracks/{hackathon_id}
```

---

## Path Parameter

| Parameter      | Type |
| -------------- | ---- |
| `hackathon_id` | UUID |

Example

```text
810d9866-f43a-4e4c-bdbc-c274dd9c6540
```

---

## Test Case

### Expected Result

The API should return all tracks created for the hackathon.

### Actual Result

Returned all three created tracks:

* Artificial Intelligence
* Cyber Security
* Web Development

along with

* Track ID
* Hackathon ID
* Description
* Prize
* Sort Order
* Created Timestamp

Status Code:

```text
200 OK
```

**Status:** ✅ Passed

---

## Response Verification

Verified that:

* Three tracks were returned.
* Track names matched the created records.
* Sort order was correct.
* Hackathon ID matched the requested hackathon.

**Status:** ✅ Passed

---

# 10. Delete Track

## Description

Deletes a track from a hackathon.

---

## Authentication

**Required**

```text
Authorization: Bearer <JWT_TOKEN>
```

Only the hackathon organizer can delete tracks.

---

## Endpoint

```http
DELETE /api/v1/tracks/{track_id}
```

---

## Path Parameter

| Parameter  | Type |
| ---------- | ---- |
| `track_id` | UUID |

Deleted Track

```text
Cyber Security
```

Track ID

```text
298a43db-0704-474f-af2f-63bd7d2a6e2e
```

---

## Test Case

### Expected Result

The selected track should be deleted successfully.

Status Code

```text
204 No Content
```

### Actual Result

Received

```text
204 No Content
```

Track was deleted successfully.

**Status:** ✅ Passed

---

## Verification

After deletion, the **List Tracks API** was executed again.

### Expected Result

Only the following tracks should remain:

* Artificial Intelligence
* Web Development

### Actual Result

The deleted track no longer appeared in the API response.

**Status:** ✅ Passed

---

## Database Verification

```sql
SELECT *
FROM tracks
WHERE hackathon_id='810d9866-f43a-4e4c-bdbc-c274dd9c6540';
```

### Expected Result

Only two tracks should exist.

### Actual Result

Supabase confirmed that the deleted track was removed successfully.

**Status:** ✅ Passed


## Final Status

✅ **Passed**

---
---

# 11. Register for Hackathon

## Objective
Verify that an authenticated participant can successfully register for a hackathon and that duplicate registrations are prevented.

## Authentication
**Required:** ✅ Yes (Bearer Token)

## Request Details

**Method**
```http
POST /api/v1/registrations/{hackathon_id}
```

**Path Parameter**
| Parameter | Type | Description |
|----------|------|-------------|
| hackathon_id | UUID | ID of the hackathon |

**Request Body**
```json
{
  "form_data": {
    "college": "Thapar Institute of Engineering and Technology",
    "year": "3rd",
    "branch": "Computer Engineering",
    "phone": "9876543210",
    "github": "https://github.com/jashan",
    "experience": "Intermediate"
  }
}
```

---

## Test Case 1 — Successful Registration

### Test Objective
Verify that an authenticated participant can register for a hackathon.

### Expected Result

- HTTP Status: **201 Created**
- Registration is created.
- User ID is automatically obtained from the authenticated JWT.
- Submitted form data is stored.

### Actual Result

✅ Passed

### Response

```json
{
    "id": "23212617-bdd4-4254-909d-e14d91289190",
    "hackathon_id": "810d9866-f43a-4e4c-bdbc-c274dd9c6540",
    "user_id": "82dc7121-0ad4-4890-a103-4398a4e97763",
    "status": "approved",
    "form_data": {
        "college": "Thapar Institute of Engineering and Technology",
        "year": "3rd",
        "branch": "Computer Engineering",
        "phone": "9876543210",
        "github": "https://github.com/jashan",
        "experience": "Intermediate"
    },
    "created_at": "2026-06-27T07:36:25.527623Z"
}
```

---

## Test Case 2 — Duplicate Registration Prevention

### Test Objective
Verify that the same authenticated user cannot register twice for the same hackathon.

### Steps

1. Login as User A.
2. Register successfully for a hackathon.
3. Submit another registration request using the **same JWT** but with different form data.

Example:

```json
{
  "form_data": {
    "college": "Thapar Institute of Engineering and Technology",
    "year": "2nd",
    "branch": "Electronics Engineering",
    "phone": "9814062675",
    "github": "https://github.com/tanya",
    "experience": "Intermediate"
  }
}
```

### Expected Result

- HTTP Status: **400 Bad Request**
- API should reject duplicate registration.

Response:

```json
{
    "detail": "Already registered"
}
```

### Actual Result

✅ Passed

### Observation

Although different registration details were entered, the backend identified the authenticated user from the JWT token rather than the submitted form data.

Duplicate registration is checked using:

```
current_user.id
+
hackathon_id
```

Therefore, changing only the form data does **not** create a new participant or bypass duplicate registration protection.

This confirms that authentication and duplicate registration logic are functioning correctly.

---

## Test Summary

| Test Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Successful Registration | 201 Created | Registration created successfully | ✅ Passed |
| Duplicate Registration | 400 Bad Request | "Already registered" returned | ✅ Passed |

---

# 12. Create Team

### Objective
Creates a new team for an approved participant in a hackathon.

### Authorization
Bearer Token (Required)

### Test Data

Hackathon ID

```
810d9866-f43a-4e4c-bdbc-c274dd9c6540
```

Request Body

```json
{
    "name": "Code Warriors"
}
```

### Expected Result

- Creates a new team.
- Generates an invite code.
- Adds the creator as the team leader.
- Adds the creator as the first team member.

### Actual Result ✅

Status Code

```
201 Created
```

Response contained

- Team ID
- Leader ID
- Invite Code
- Members array
- Created Timestamp

### Status

✅ Passed

---

## 13. Join Team

### Objective

Allows an approved participant to join a team using an invite code.

### Authorization

Bearer Token (Required)

### Positive Test

Request

```json
{
    "invite_code": "NIVRHJCK"
}
```

Expected

```
200 OK
```

Returned team information and members list.

### Negative Test

Request

```json
{
    "invite_code": "ABC123"
}
```

Response

```
404 Not Found
```

```json
{
    "detail": "Invalid invite code"
}
```

### Observation

During testing, duplicate user IDs appeared in the members list after joining. This indicates the join request may have been executed using the same authenticated user instead of a second participant account. Requires verification using a different user token.

### Status

⚠ Functional but requires verification with multiple users.

---

# 14. Leave Team

### Objective

Removes the authenticated user from their current team.

### Authorization

Bearer Token (Required)

### Negative Test

User attempted to leave without belonging to a team.

Response

```
404 Not Found
```

```json
{
    "detail": "Not in a team"
}
```

### Expected Behavior

API correctly prevents users from leaving a team they are not part of.

### Status

✅ Negative test passed

---
