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

## Final Status

✅ **Passed**
