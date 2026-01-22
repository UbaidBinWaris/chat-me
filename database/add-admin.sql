-- Create Admin User
-- Email: admin@chatme.com
-- Password: Admin@123!

-- First, let's check if admin already exists
SELECT 'Checking for existing admin user...' as status;
SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin';

-- Insert admin user
INSERT INTO users (email, username, password_hash, role, full_name)
VALUES ('admin@chatme.com', 'admin', '$2b$10$OM6pkPw0IMIpOUDo.6JgseNYmfwkDzRzyqYlv/q3dE4UQv9ugwgBS', 'admin', 'System Administrator')
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2b$10$OM6pkPw0IMIpOUDo.6JgseNYmfwkDzRzyqYlv/q3dE4UQv9ugwgBS',
    role = 'admin',
    full_name = 'System Administrator';

-- Verify admin was created
SELECT 'Admin user status:' as status;
SELECT id, email, username, role, full_name, created_at 
FROM users 
WHERE role = 'admin';

-- Show all users
SELECT 'All users in system:' as status;
SELECT id, email, username, role, full_name 
FROM users 
ORDER BY role, id;
