# 🎓 Production-Ready Next.js Authentication System - Complete Guide

## 📋 Project Overview

This is a **production-ready Next.js authentication system** built with modern best practices. The project includes user registration, login, JWT-based authentication, protected routes, and comprehensive API testing.

---

## 🏗️ Architecture & Structure

### **Tech Stack**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **Testing**: Jest

### **Project Structure**
```
chat-me/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── register/         # User registration endpoint
│   │   │   │   └── route.ts
│   │   │   ├── login/            # User login endpoint
│   │   │   │   └── route.ts
│   │   │   └── me/               # Get current user (protected)
│   │   │       └── route.ts
│   │   └── protected/            # Example protected endpoint
│   │       └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── lib/                          # Utility libraries
│   ├── auth.ts                   # JWT & password utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── validation.ts             # Zod validation schemas
│   ├── errors.ts                 # Custom error classes
│   └── api-response.ts           # Standardized API responses
│
├── services/                     # Business logic layer
│   └── auth.service.ts           # Authentication service
│
├── prisma/                       # Database
│   └── schema.prisma             # Database schema
│
├── __tests__/                    # Test files
│   └── auth.test.ts              # API tests
│
├── middleware.ts                 # Route protection middleware
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Jest setup
├── prisma.config.ts              # Prisma config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## 🔍 Detailed Component Explanation

### **1. Database Layer (Prisma)**

#### **prisma/schema.prisma**
Defines the database schema for the User model:

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([email])
  @@map("users")
}
```

**Features**:
- `cuid()`: Collision-resistant unique identifier
- `@unique`: Ensures email uniqueness
- `@@index`: Optimizes email lookups
- `@@map`: Maps to "users" table in database
- `updatedAt`: Auto-updated timestamp

#### **lib/prisma.ts**
Singleton pattern for Prisma Client to prevent multiple instances:

```typescript
const prisma = globalForPrisma.prisma ?? new PrismaClient({...});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Why**: In development, Next.js hot-reloads can create multiple database connections. This pattern prevents that.

---

### **2. Authentication Layer**

#### **lib/auth.ts**
Core authentication utilities:

**Functions**:
1. `hashPassword(password: string)` - Uses bcrypt with 10 salt rounds
2. `verifyPassword(password, hash)` - Compares password with hash
3. `generateToken(payload)` - Creates JWT with user data
4. `verifyToken(token)` - Validates and decodes JWT
5. `extractToken(authHeader)` - Extracts token from "Bearer" header

**Security Features**:
- bcrypt salt rounds: 10 (good balance of security/performance)
- JWT expiry: 7 days (configurable via .env)
- JWT secret: Strong secret required in production

---

### **3. Validation Layer (Zod)**

#### **lib/validation.ts**

**Register Schema**:
```typescript
registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
})
```

**Password Requirements**:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number

**Login Schema**:
- Email validation
- Password presence check (no complexity check for login)

---

### **4. Error Handling**

#### **lib/errors.ts**
Custom error classes extending base `AppError`:

```typescript
class AppError extends Error {
  constructor(statusCode, message, isOperational = true)
}

class ValidationError extends AppError { statusCode: 400 }
class UnauthorizedError extends AppError { statusCode: 401 }
class NotFoundError extends AppError { statusCode: 404 }
class ConflictError extends AppError { statusCode: 409 }
```

**isOperational**: Distinguishes expected errors (user mistakes) from unexpected bugs

#### **lib/api-response.ts**
Standardized response format:

**Success Response**:
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

**Error Response**:
```typescript
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: unknown
  }
}
```

**handleApiError()**: Automatically converts errors to proper HTTP responses

---

### **5. Service Layer**

#### **services/auth.service.ts**
Business logic separated from API routes:

**registerUser()**:
1. Check if email already exists → `ConflictError`
2. Hash password with bcrypt
3. Create user in database
4. Generate JWT token
5. Return user + token

**loginUser()**:
1. Find user by email → `UnauthorizedError` if not found
2. Verify password → `UnauthorizedError` if wrong
3. Generate JWT token
4. Return user + token

**getUserById()**:
1. Find user by ID
2. Return user data (without password hash)

**Why separate services**: 
- Easier to test
- Reusable logic
- Clean separation of concerns

---

### **6. API Routes**

#### **app/api/auth/register/route.ts**
```typescript
export async function POST(request: NextRequest) {
  1. Parse JSON body
  2. Validate with Zod schema
  3. Call registerUser() service
  4. Return standardized response
}
```

#### **app/api/auth/login/route.ts**
Same pattern as register

#### **app/api/auth/me/route.ts** (Protected)
```typescript
export async function GET(request: NextRequest) {
  1. Extract token from Authorization header
  2. Verify token
  3. Get user from database
  4. Return user data
}
```

#### **app/api/protected/route.ts**
Example protected route using middleware

---

### **7. Middleware (Route Protection)**

#### **middleware.ts**

**How it works**:
1. Runs before route handler
2. Checks if route is protected
3. Extracts JWT from Authorization header or cookie
4. Verifies token
5. Adds user info to request headers
6. Allows request to proceed or returns 401

**Protected Routes**:
```typescript
const protectedRoutes = ['/api/protected', '/api/user', '/dashboard'];
```

**Injected Headers**:
- `x-user-id`: User ID from token
- `x-user-email`: User email from token

**Why headers**: Routes can access user info without re-verifying token

---

### **8. Testing**

#### **__tests__/auth.test.ts**

**Test Cases**:

**Registration Tests**:
- ✅ Successful registration
- ✅ Invalid email format
- ✅ Weak password
- ✅ Missing name
- ✅ Duplicate email (409 Conflict)

**Login Tests**:
- ✅ Successful login
- ✅ Wrong password (401)
- ✅ Non-existent email (401)
- ✅ Invalid email format (400)
- ✅ Missing password (400)

**Protected Route Tests**:
- ✅ Access with valid token
- ✅ Deny without token (401)
- ✅ Deny with invalid token (401)

**Test Setup**:
- `beforeAll`: Clean database
- `beforeEach`: Reset test user
- `afterAll`: Cleanup and disconnect

---

## 🔐 Security Implementation

### **Password Security**
1. **Never store plain text passwords**
2. **bcrypt** with 10 salt rounds (2^10 = 1024 iterations)
3. **Salt** is automatically generated per password
4. **Hash** is one-way (cannot be decrypted)

### **JWT Security**
1. **Signed** with secret key (prevents tampering)
2. **Expiry** set to 7 days (prevents indefinite access)
3. **Payload** contains minimal info (userId, email only)
4. **Secret** must be strong in production

### **Input Validation**
1. **Zod** validates all inputs before processing
2. **Email** normalized (lowercase, trimmed)
3. **SQL Injection** prevented by Prisma (parameterized queries)
4. **XSS** prevented by Next.js (auto-escaping)

### **Error Messages**
1. **Generic** for authentication ("Invalid email or password")
   - Prevents email enumeration attacks
2. **Specific** for validation errors (helps developers)

---

## 🚀 Setup & Deployment

### **Environment Variables (.env)**

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# JWT
JWT_SECRET="change-this-to-a-random-64-character-string"
JWT_EXPIRES_IN="7d"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Production Checklist**:
- [ ] Use strong JWT_SECRET (64+ characters, random)
- [ ] Enable HTTPS
- [ ] Set NODE_ENV="production"
- [ ] Use connection pooling for database
- [ ] Enable rate limiting
- [ ] Add CORS headers
- [ ] Set up monitoring/logging

### **Database Setup**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# OR create migration (production)
npm run db:migrate
```

### **Running the App**

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm test
```

---

## 📊 API Endpoints Reference

### **POST /api/auth/register**

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### **POST /api/auth/login**

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200)**: Same as register

### **GET /api/auth/me** 🔒

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-02T00:00:00.000Z"
  }
}
```

---

## 🧩 Common Patterns & Best Practices

### **1. Service Layer Pattern**
Separate business logic from API routes for:
- **Testability**: Services are easier to unit test
- **Reusability**: Logic can be called from multiple routes
- **Clarity**: Routes are thin, focusing on HTTP concerns

### **2. Error Handling Pattern**
```typescript
try {
  const data = await schema.parse(body);  // Zod validation
  const result = await service(data);     // Business logic
  return successResponse(result);         // Standardized response
} catch (error) {
  return handleApiError(error);           // Auto-converts to HTTP response
}
```

### **3. Repository Pattern** (Future Enhancement)
Consider adding a repository layer:
```
Route → Service → Repository → Prisma
```

---

## 🔧 Troubleshooting

### **Database Connection Issues**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify network access

### **JWT Errors**
- Check JWT_SECRET is set
- Verify token hasn't expired
- Check "Bearer " prefix in Authorization header

### **Validation Errors**
- Check request body matches schema
- Ensure Content-Type is application/json
- Review password requirements

---

## 📚 Next Steps & Enhancements

### **Security Enhancements**
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement refresh tokens
- [ ] Add email verification
- [ ] Enable 2FA
- [ ] Add account lockout after failed attempts
- [ ] Implement CSRF protection

### **Features**
- [ ] Password reset flow
- [ ] Social auth (Google, GitHub)
- [ ] Role-based access control (RBAC)
- [ ] User profile management
- [ ] Session management
- [ ] Audit logging

### **Performance**
- [ ] Add Redis for sessions
- [ ] Implement database connection pooling
- [ ] Add caching layer
- [ ] Optimize Prisma queries

### **Monitoring**
- [ ] Add logging (Winston/Pino)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Uptime monitoring

---

## 🎯 Key Takeaways

1. **Separation of Concerns**: Routes → Services → Database
2. **Security First**: Hashing, JWT, validation, error handling
3. **Type Safety**: TypeScript everywhere
4. **Testing**: Comprehensive test coverage
5. **Standardization**: Consistent responses and error formats
6. **Documentation**: Clear code and API documentation

---

**Built with ❤️ using Next.js, TypeScript, and best practices**
