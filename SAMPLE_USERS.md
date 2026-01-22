# Sample Users Created

The database has been initialized with 3 users for testing:

## 1. Admin User (System Administrator)
- **Email:** admin@chatme.com
- **Username:** admin
- **Password:** Admin@123!
- **Role:** Admin
- **Access:** Full system access

## 2. Agent User
- **Email:** agent@example.com
- **Username:** agent_user
- **Password:** Sample123!
- **Role:** Agent

## 3. Management User
- **Email:** manager@example.com
- **Username:** manager_user
- **Password:** Sample123!
- **Role:** Management

---

## Login Instructions

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000/login

3. Use one of the accounts above to login

---

## Important Notes

### Admin User
- **Full system access** - can manage all users and settings
- **Cannot be created via registration form** - only through database
- Keep credentials secure in production

### Registration
- New users can only register as **Agent** or **Management** roles
- **Admin role is NOT available** for public registration
- Visit http://localhost:3000/register to create a new account

---

## Password Requirements

When creating new accounts:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number
- At least 1 special character (@$!%*?&)

Example: `Sample123!`

---

## Testing API

### Login with sample user:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "password": "Sample123!"
  }'
```

### Register new agent:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newagent@example.com",
    "username": "newagent",
    "password": "NewAgent123!",
    "role": "agent",
    "full_name": "New Agent"
  }'
```
