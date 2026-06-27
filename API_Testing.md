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
