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

# 5. Create Hackathon

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


