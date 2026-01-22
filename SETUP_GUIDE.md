# Chat-Me Authentication System

A complete authentication system built with Next.js 14, PostgreSQL, JWT, and bcrypt encryption.

## Features

- ✅ User registration with role-based access (Admin, Management, Agent)
- ✅ Secure login with JWT authentication
- ✅ Password encryption using bcrypt
- ✅ Form validation (client-side and server-side)
- ✅ Error handling and user feedback
- ✅ Protected routes and middleware
- ✅ PostgreSQL database with proper schema
- ✅ Responsive UI with Tailwind CSS

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Validation:** Custom validation utilities

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE chat_database;
CREATE USER chat_user WITH PASSWORD 'chat_password';
GRANT ALL PRIVILEGES ON DATABASE chat_database TO chat_user;

# Connect to the database
\c chat_database

# Grant schema privileges
GRANT ALL ON SCHEMA public TO chat_user;
```

### 2. Run Database Schema

Execute the SQL schema to create tables:

```bash
psql -U chat_user -d chat_database -f database/schema.sql
```

Or manually run the schema from `database/schema.sql`

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env` file should already contain:

```env
# DB connection settings
DB_HOST=localhost
DB_PORT=5432
DB_USER=chat_user
DB_PASSWORD=chat_password
DB_NAME=chat_database

# JWT settings
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this
JWT_REFRESH_EXPIRES_IN=7d
```

**⚠️ IMPORTANT:** Change the JWT secrets in production!

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### User Registration

1. Navigate to `/register`
2. Fill in the registration form:
   - Email (required)
   - Username (required, 3-30 chars, alphanumeric + underscore)
   - Password (required, min 8 chars with uppercase, lowercase, number, special char)
   - Confirm Password
   - Full Name (optional)
   - Role (Admin, Management, or Agent)
3. Click "Register"
4. Upon success, you'll be redirected to the login page

### User Login

1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign in"
4. Upon success, you'll be redirected to the dashboard

### Dashboard

After logging in, you'll see:
- User profile information
- Role badge
- Quick action buttons
- Logout functionality

## API Endpoints

### POST `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "agent"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "agent",
    "full_name": "John Doe"
  }
}
```

### POST `/api/auth/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "agent",
    "full_name": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### GET `/api/auth/profile`

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "agent"
  }
}
```

## Project Structure

```
chat-me/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/route.ts    # Registration endpoint
│   │       ├── login/route.ts       # Login endpoint
│   │       └── profile/route.ts     # Profile endpoint
│   ├── dashboard/
│   │   └── page.tsx                 # Dashboard page
│   ├── register/
│   │   └── page.tsx                 # Registration page
│   ├── login/
│   │   └── page.tsx                 # Login page
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── RegistrationForm.tsx         # Registration form component
│   └── LoginForm.tsx                # Login form component
├── lib/
│   ├── db.ts                        # Database connection
│   ├── auth.ts                      # Authentication utilities
│   ├── user.ts                      # User database operations
│   ├── middleware.ts                # Auth middleware
│   └── errors.ts                    # Error handling & validation
├── types/
│   └── user.ts                      # TypeScript types
├── database/
│   └── schema.sql                   # PostgreSQL schema
└── .env                             # Environment variables
```

## User Roles

- **Admin:** Full access to all features
- **Management:** Access to management features
- **Agent:** Basic user access

## Security Features

1. **Password Hashing:** All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens:** Secure token-based authentication
3. **Token Expiration:** Access tokens expire in 1 hour, refresh tokens in 7 days
4. **Input Validation:** Both client-side and server-side validation
5. **SQL Injection Prevention:** Using parameterized queries
6. **XSS Protection:** React's built-in XSS protection

## Validation Rules

### Email
- Valid email format
- Unique in database

### Username
- 3-30 characters
- Alphanumeric and underscore only
- Unique in database

### Password
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

## Error Handling

The system includes comprehensive error handling:

- **400 Bad Request:** Validation errors
- **401 Unauthorized:** Authentication failures
- **403 Forbidden:** Insufficient permissions
- **409 Conflict:** Duplicate email/username
- **500 Internal Server Error:** Server errors

All errors return JSON responses with error details.

## Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Testing the System

### 1. Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "full_name": "Test User",
    "role": "agent"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Test Profile (Protected Route)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if the database and user exist

### Module Not Found Errors
- Run `npm install` to ensure all dependencies are installed

### JWT Token Issues
- Ensure JWT secrets are set in `.env`
- Check token expiration times

## Next Steps

Consider implementing:
- [ ] Password reset functionality
- [ ] Email verification
- [ ] OAuth integration (Google, GitHub)
- [ ] Rate limiting
- [ ] Session management
- [ ] User profile updates
- [ ] Admin panel for user management
- [ ] Audit logging
- [ ] Two-factor authentication

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
