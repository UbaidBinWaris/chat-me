# Chat-Me 💬

A full-stack chat application with secure authentication, role-based access control, and PostgreSQL database.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- 👥 **Role-Based Access Control** - Admin, Management, and Agent roles
- 📝 **User Registration & Login** - Complete authentication flow with validation
- 🎨 **Modern UI** - Built with Tailwind CSS and responsive design
- 🛡️ **Security First** - Input validation, SQL injection prevention, XSS protection
- 🔄 **Error Handling** - Comprehensive error handling and user feedback
- 📊 **PostgreSQL Database** - Robust relational database with proper schema

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running
- npm or yarn package manager

### 1. Clone & Install

```bash
cd chat-me
npm install
```

### 2. Setup Database

**Option A: Automated (Windows)**
```bash
setup-database.bat
```

**Option B: Manual**
```bash
# See DATABASE_SETUP.md for detailed instructions
psql -U postgres -c "CREATE DATABASE chat_database;"
psql -U postgres -c "CREATE USER chat_user WITH PASSWORD 'chat_password';"
psql -U chat_user -d chat_database -f database/init.sql
```

### 3. Configure Environment

The `.env` file is already configured with default values. For production, update:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- Database credentials

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and API documentation
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database configuration guide

## 🎯 Quick Test

1. **Register**: Navigate to `/register` and create an account
2. **Login**: Go to `/login` and sign in
3. **Dashboard**: View your profile at `/dashboard`

### Test API Endpoints

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!@#","role":"agent"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

## 🏗️ Project Structure

```
chat-me/
├── app/                    # Next.js app directory
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/            # React components
├── lib/                  # Utilities & business logic
│   ├── auth.ts          # JWT & password utilities
│   ├── db.ts            # Database connection
│   ├── user.ts          # User operations
│   ├── middleware.ts    # Auth middleware
│   └── errors.ts        # Error handling
├── types/                # TypeScript types
├── database/             # Database schema & scripts
└── .env                  # Environment variables
```

## 🔑 User Roles

- **Admin** - Full system access
- **Management** - Management features
- **Agent** - Basic user access

## 🔒 Security Features

- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ JWT access & refresh tokens
- ✅ Token expiration (1h access, 7d refresh)
- ✅ Input validation (client & server)
- ✅ Parameterized SQL queries
- ✅ Protected API routes
- ✅ Role-based authorization

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Styling:** Tailwind CSS
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Database Client:** node-postgres (pg)

## 📝 API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/profile` | GET | Get user profile | Yes |

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed API documentation.

## 🧪 Validation Rules

- **Email:** Valid format, unique
- **Username:** 3-30 chars, alphanumeric + underscore, unique
- **Password:** Min 8 chars, uppercase, lowercase, number, special char

## 🐛 Troubleshooting

**Database connection issues?**
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check [DATABASE_SETUP.md](DATABASE_SETUP.md)

**Module not found?**
```bash
npm install
```

**Port already in use?**
```bash
# Change port in package.json or kill the process
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)

## 🚀 Deployment

### Vercel (Recommended for Next.js)
1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables for Production
- Update all JWT secrets
- Use production database credentials
- Enable SSL for database connections

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ for Chat-Me

---

**Need help?** Check out the [SETUP_GUIDE.md](SETUP_GUIDE.md) or open an issue.
