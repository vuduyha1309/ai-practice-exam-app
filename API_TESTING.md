# Auth API Testing Guide

## Base URL
```
http://localhost:3000/api/v1
```

## 1. Register - POST /auth/register

### Curl Command
```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Nguyen Van A",
    "email": "user@example.com",
    "phone": "0901234567",
    "password": "password123"
  }'
```

### Postman
- Method: `POST`
- URL: `http://localhost:3000/api/v1/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0901234567",
  "password": "password123"
}
```

### Success Response (201 Created)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Nguyen Van A",
    "phone": "0901234567",
    "avatarUrl": null,
    "isActive": true,
    "createdAt": "2026-07-09T10:30:00Z"
  }
}
```

### Error Response (409 Conflict - Email exists)
```json
{
  "statusCode": 409,
  "message": "Email đã được sử dụng",
  "error": "Conflict"
}
```

---

## 2. Register - Without Phone (Optional)

### Curl Command
```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Nguyen Van B",
    "email": "user2@example.com",
    "password": "password456"
  }'
```

### Postman Body (raw JSON)
```json
{
  "name": "Nguyen Van B",
  "email": "user2@example.com",
  "password": "password456"
}
```

---

## 3. Login - POST /auth/login (by Email)

### Curl Command
```bash
curl --location 'http://localhost:3000/api/v1/auth/login' \
  --header 'Content-Type: application/json' \
  --data '{
    "identifier": "user@example.com",
    "password": "password123"
  }'
```

### Postman
- Method: `POST`
- URL: `http://localhost:3000/api/v1/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

### Success Response (200 OK)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Nguyen Van A",
    "phone": "0901234567",
    "avatarUrl": null,
    "isActive": true,
    "createdAt": "2026-07-09T10:30:00Z"
  }
}
```

---

## 4. Login - POST /auth/login (by Phone)

### Curl Command
```bash
curl --location 'http://localhost:3000/api/v1/auth/login' \
  --header 'Content-Type: application/json' \
  --data '{
    "identifier": "0901234567",
    "password": "password123"
  }'
```

### Postman Body (raw JSON)
```json
{
  "identifier": "0901234567",
  "password": "password123"
}
```

### Error Response (401 Unauthorized - Wrong password)
```json
{
  "statusCode": 401,
  "message": "Thông tin đăng nhập không đúng",
  "error": "Unauthorized"
}
```

---

## 5. Get Current User - GET /users/me (Protected)

**⚠️ IMPORTANT: Replace `YOUR_ACCESS_TOKEN` with actual token from login/register response**

### Curl Command
```bash
curl --location 'http://localhost:3000/api/v1/users/me' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Postman
- Method: `GET`
- URL: `http://localhost:3000/api/v1/users/me`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`

### Success Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "Nguyen Van A",
  "phone": "0901234567",
  "avatarUrl": null,
  "isActive": true,
  "createdAt": "2026-07-09T10:30:00Z"
}
```

### Error Response (401 Unauthorized - No token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Error Response (401 Unauthorized - Invalid token)
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

---

## 6. Logout - POST /auth/logout (Protected)

### Curl Command
```bash
curl --location --request POST 'http://localhost:3000/api/v1/auth/logout' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Postman
- Method: `POST`
- URL: `http://localhost:3000/api/v1/auth/logout`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN`
- Body: (empty)

### Success Response (200 OK)
```json
{
  "message": "Đăng xuất thành công"
}
```

---

## Test Flow

### 1. Complete Registration Flow
```bash
# Step 1: Register
curl --location 'http://localhost:3000/api/v1/auth/register' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "0901234567",
    "password": "testpass123"
  }'

# Response contains: accessToken
# Copy the accessToken for next steps

# Step 2: Get current user (use token from step 1)
curl --location 'http://localhost:3000/api/v1/users/me' \
  --header 'Authorization: Bearer <PASTE_TOKEN_HERE>'

# Step 3: Logout
curl --location --request POST 'http://localhost:3000/api/v1/auth/logout' \
  --header 'Authorization: Bearer <PASTE_TOKEN_HERE>'
```

### 2. Login Flow
```bash
# Step 1: Login by email
curl --location 'http://localhost:3000/api/v1/auth/login' \
  --header 'Content-Type: application/json' \
  --data '{
    "identifier": "test@example.com",
    "password": "testpass123"
  }'

# Response contains: accessToken
# Copy the accessToken for next steps

# Step 2: Get current user (use token from step 1)
curl --location 'http://localhost:3000/api/v1/users/me' \
  --header 'Authorization: Bearer <PASTE_TOKEN_HERE>'
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `"Email không hợp lệ"` | Invalid email format | Use valid email format: `user@example.com` |
| `"Số điện thoại không hợp lệ"` | Invalid phone format | Use Vietnamese format: `+84` or `0` + 9 digits |
| `"Mật khẩu tối thiểu 8 ký tự"` | Password too short | Use minimum 8 characters |
| `"Email đã được sử dụng"` | Email already registered | Use different email or login instead |
| `"Số điện thoại đã được sử dụng"` | Phone already registered | Use different phone or login instead |
| `"Thông tin đăng nhập không đúng"` | Invalid credentials | Check email/phone and password |
| `"Tài khoản đã bị khóa"` | Account inactive | Contact admin to unlock |
| `"Unauthorized"` | Missing/invalid token | Add valid Authorization header |

---

## Postman Collection JSON

Save as `auth-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Auth API",
    "description": "AI Exam Practice - Authentication API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Nguyen Van A\",\n  \"email\": \"user@example.com\",\n  \"phone\": \"0901234567\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "register"]
        }
      }
    },
    {
      "name": "Login by Email",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"identifier\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "login"]
        }
      }
    },
    {
      "name": "Login by Phone",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"identifier\": \"0901234567\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "login"]
        }
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/users/me",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "users", "me"]
        }
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/logout",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "logout"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "accessToken",
      "value": "",
      "type": "string"
    }
  ]
}
```

**To use in Postman:**
1. Click "Import" → paste the JSON above
2. After login, copy `accessToken` from response
3. Set it in Postman environment variable: `{{accessToken}}`
