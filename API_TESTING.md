# API Testing Guide

This file contains example API requests for testing the Chat-Me authentication system.

## Prerequisites

Make sure:
- Development server is running: `npm run dev`
- Database is set up and running
- Server is accessible at http://localhost:3000

## Test 1: Register a New User

### Request
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "full_name": "John Doe",
    "role": "agent"
  }'
```

### Expected Response (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "agent",
    "full_name": "John Doe"
  }
}
```

## Test 2: Register Admin User

### Request
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "Admin123!@#",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

## Test 3: Login

### Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

### Expected Response (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "agent",
    "full_name": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Important:** Save the `accessToken` for the next test!

## Test 4: Get User Profile (Protected Route)

### Request
Replace `YOUR_ACCESS_TOKEN` with the token from the login response.

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example with actual token
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJyb2xlIjoiYWdlbnQiLCJpYXQiOjE3MDYwMDAwMDAsImV4cCI6MTcwNjAwMzYwMH0.XXXXXXXXXXXXX"
```

### Expected Response (200 OK)
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "agent"
  }
}
```

## Test 5: Error Cases

### Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "username": "testuser",
    "password": "Test123!@#",
    "role": "agent"
  }'
```

**Expected:** 400 Bad Request with validation errors

### Weak Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "weak",
    "role": "agent"
  }'
```

**Expected:** 400 Bad Request - password doesn't meet requirements

### Duplicate Email
Try registering the same email twice:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe2",
    "password": "Test123!@#",
    "role": "agent"
  }'
```

**Expected:** 409 Conflict - email already registered

### Invalid Credentials (Login)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "WrongPassword123!"
  }'
```

**Expected:** 401 Unauthorized - invalid credentials

### Access Protected Route Without Token
```bash
curl -X GET http://localhost:3000/api/auth/profile
```

**Expected:** 401 Unauthorized - authentication required

### Access Protected Route With Invalid Token
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:** 401 Unauthorized - invalid token

## Testing with Postman

### Import Collection

You can create a Postman collection with these requests:

1. **Register User**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/register`
   - Body (JSON):
   ```json
   {
     "email": "{{email}}",
     "username": "{{username}}",
     "password": "{{password}}",
     "full_name": "{{full_name}}",
     "role": "agent"
   }
   ```

2. **Login**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
   ```json
   {
     "email": "{{email}}",
     "password": "{{password}}"
   }
   ```
   - Tests (to save token):
   ```javascript
   const response = pm.response.json();
   pm.environment.set("accessToken", response.tokens.accessToken);
   ```

3. **Get Profile**
   - Method: GET
   - URL: `http://localhost:3000/api/auth/profile`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer {{accessToken}}`

## Testing in Browser

### Using Browser Console

1. Open http://localhost:3000/register
2. Open Developer Tools (F12)
3. Go to Console tab
4. Test API calls:

```javascript
// Register
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!@#',
    role: 'agent'
  })
})
.then(r => r.json())
.then(console.log);

// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#'
  })
})
.then(r => r.json())
.then(data => {
  console.log(data);
  localStorage.setItem('accessToken', data.tokens.accessToken);
});

// Get Profile
fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(console.log);
```

## Automated Testing Script

Save this as `test-api.sh` (Linux/Mac) or `test-api.bat` (Windows):

```bash
#!/bin/bash

echo "Testing Chat-Me API..."
echo ""

echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "role": "agent"
  }')
echo "$REGISTER_RESPONSE"
echo ""

echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!@#"
  }')
echo "$LOGIN_RESPONSE"
echo ""

# Extract token (requires jq)
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')

echo "3. Getting profile..."
curl -s -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "Testing complete!"
```

## Response Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful login or profile retrieval |
| 201 | Created | User successfully registered |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Invalid credentials or missing token |
| 403 | Forbidden | Insufficient permissions |
| 409 | Conflict | Duplicate email/username |
| 500 | Server Error | Internal server error |

## Tips

1. **Use environment variables** in Postman for email, username, password
2. **Save access tokens** in Postman environment for easy testing
3. **Check browser DevTools** Network tab when testing forms
4. **Monitor server logs** in terminal running `npm run dev`
5. **Check database** with `psql` to verify data is being saved

## Common Issues

### "fetch failed" error
- Ensure server is running on port 3000
- Check if another process is using the port

### "connect ECONNREFUSED"
- Database connection failed
- Verify PostgreSQL is running
- Check `.env` database credentials

### 401 Unauthorized on profile endpoint
- Token might be expired (1 hour expiration)
- Login again to get a fresh token
- Check if Bearer prefix is included

### Validation errors
- Review password requirements (8+ chars, uppercase, lowercase, number, special char)
- Check email format
- Verify username format (3-30 chars, alphanumeric + underscore)
