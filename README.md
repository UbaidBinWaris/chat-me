# Chat-Me - Production-Ready Authentication System

A production-ready Next.js application with JWT authentication, built with TypeScript, PostgreSQL, and Prisma ORM.

## 🚀 Features

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **PostgreSQL** database with **Prisma ORM**
- **JWT authentication** with bcrypt password hashing
- **Zod validation** for input validation
- **Middleware** for protected routes
- **Error handling** with custom error classes
- **API testing** with Jest
- **Environment variables** management

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn or pnpm or bun

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/UbaidBinWaris/chat-me.git
cd chat-me
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your database connection string and JWT secret:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chatme?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
npm run db:push
# or
npm run db:migrate
```

5. **Generate Prisma Client**
```bash
npm run db:generate
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode
```bash
npm run build
npm run start
```

## 📁 Project Structure

```
chat-me/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts       # POST /api/auth/login
│   │   │   ├── register/
│   │   │   │   └── route.ts       # POST /api/auth/register
│   │   │   └── me/
│   │   │       └── route.ts       # GET /api/auth/me (protected)
│   │   └── protected/
│   │       └── route.ts           # Example protected route
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts                    # JWT & password utilities
│   ├── prisma.ts                  # Prisma client instance
│   ├── validation.ts              # Zod schemas
│   ├── errors.ts                  # Custom error classes
│   └── api-response.ts            # API response helpers
├── services/
│   └── auth.service.ts            # Authentication business logic
├── prisma/
│   └── schema.prisma              # Database schema
├── __tests__/
│   └── auth.test.ts               # API tests
├── middleware.ts                  # Route protection middleware
├── jest.config.js                 # Jest configuration
└── package.json
```

## 🔌 API Endpoints

### Public Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt-token"
  },
  "message": "User registered successfully"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

### Protected Endpoints

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {jwt-token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-02T00:00:00.000Z"
  },
  "message": "User retrieved successfully"
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Signed tokens with expiry
- **Input Validation**: Zod schemas for all inputs
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Protected Routes**: Middleware validation for sensitive endpoints

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in CI mode:
```bash
npm run test:ci
```

### Test Coverage

The test suite includes:
- ✅ User registration (valid/invalid inputs)
- ✅ User login (correct/wrong credentials)
- ✅ Protected route access (with/without token)
- ✅ Token validation
- ✅ Duplicate email handling
- ✅ Input validation errors

## 🗄️ Database Schema

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database (dev)
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🛡️ Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

## 🚦 Middleware Configuration

Protected routes are defined in [middleware.ts](middleware.ts):

```typescript
const protectedRoutes = ['/api/protected', '/api/user', '/dashboard'];
```

Add your protected routes to this array.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Ubaid Bin Waris**
- GitHub: [@UbaidBinWaris](https://github.com/UbaidBinWaris)

## 🙏 Acknowledgments

- Next.js Team
- Prisma Team
- Vercel

---

Built with ❤️ using Next.js and TypeScript
