# Chat-Me Database Quick Start

## Prerequisites
- PostgreSQL installed and running
- psql command-line tool available

## Option 1: Automated Setup (Windows)

Run the batch file:
```bash
setup-database.bat
```

## Option 2: Manual Setup

### Step 1: Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# In psql prompt, run these commands:
CREATE DATABASE chat_database;
CREATE USER chat_user WITH PASSWORD 'chat_password';
GRANT ALL PRIVILEGES ON DATABASE chat_database TO chat_user;
\c chat_database
GRANT ALL ON SCHEMA public TO chat_user;
\q
```

### Step 2: Initialize Database Schema

```bash
# Run the initialization script
psql -U chat_user -d chat_database -f database/init.sql
```

### Step 3: Verify Setup

```bash
# Connect to database
psql -U chat_user -d chat_database

# Check tables
\dt

# You should see:
# - users
# - refresh_tokens

# Exit
\q
```

## Test Your Setup

### 1. Start the development server
```bash
npm run dev
```

### 2. Open your browser
Navigate to: http://localhost:3000/register

### 3. Register a test user
- Email: test@example.com
- Username: testuser
- Password: Test123!@#
- Role: Agent

### 4. Login
Navigate to: http://localhost:3000/login
- Use the credentials you just created

### 5. View Dashboard
After login, you'll be redirected to the dashboard

## Troubleshooting

### "psql: command not found"
Add PostgreSQL bin directory to your PATH:
- Windows: `C:\Program Files\PostgreSQL\16\bin`
- Check PostgreSQL installation directory

### "FATAL: password authentication failed"
- Verify PostgreSQL is running
- Check username/password in `.env` file
- Try resetting the user password:
  ```sql
  ALTER USER chat_user WITH PASSWORD 'chat_password';
  ```

### "database does not exist"
Make sure you created the database:
```bash
psql -U postgres -c "CREATE DATABASE chat_database;"
```

### Connection Refused
- Ensure PostgreSQL service is running
- Check DB_HOST and DB_PORT in `.env`
- Default PostgreSQL port is 5432

## Database Schema Overview

### Users Table
- `id` - Primary key
- `email` - Unique, required
- `username` - Unique, required
- `password_hash` - Bcrypt hashed password
- `role` - ENUM ('admin', 'management', 'agent')
- `full_name` - Optional
- `is_active` - Boolean flag
- `created_at` - Timestamp
- `updated_at` - Auto-updated timestamp
- `last_login` - Last login timestamp

### Refresh Tokens Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `token` - JWT refresh token
- `expires_at` - Expiration timestamp
- `created_at` - Creation timestamp
- `revoked` - Boolean flag

## Next Steps

1. ✅ Database is set up
2. ✅ Tables are created
3. ✅ Start the server: `npm run dev`
4. ✅ Test registration at `/register`
5. ✅ Test login at `/login`
6. ✅ View dashboard at `/dashboard`

## Important Security Notes

⚠️ **Before deploying to production:**

1. Change JWT secrets in `.env`:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

2. Use strong database credentials

3. Enable SSL for PostgreSQL connections

4. Set up proper firewall rules

5. Consider using environment-specific `.env` files

6. Enable HTTPS for your application

7. Implement rate limiting

8. Set up proper backup strategies
