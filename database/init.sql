-- Quick Database Initialization Script
-- Run this after creating the database and user

-- Connect to your database first:
-- psql -U chat_user -d chat_database

-- Then run this file:
-- \i database/init.sql
-- or: psql -U chat_user -d chat_database -f database/init.sql

-- Check if we're connected to the correct database
SELECT current_database();

-- Create ENUM type for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'management', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Insert sample users
-- Admin password: Admin@123!
-- Agent/Manager password: Sample123!
INSERT INTO users (email, username, password_hash, role, full_name)
VALUES 
  ('admin@chatme.com', 'admin', '$2b$10$OM6pkPw0IMIpOUDo.6JgseNYmfwkDzRzyqYlv/q3dE4UQv9ugwgBS', 'admin', 'System Administrator'),
  ('agent@example.com', 'agent_user', '$2b$10$r4BtYgSyvPkOWIaWgWO3.eFjDcoBjmLeiySE351Z1egZhlXnGcO.a', 'agent', 'Agent User'),
  ('manager@example.com', 'manager_user', '$2b$10$r4BtYgSyvPkOWIaWgWO3.eFjDcoBjmLeiySE351Z1egZhlXnGcO.a', 'management', 'Management User')
ON CONFLICT (email) DO NOTHING;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show user count
SELECT COUNT(*) as user_count FROM users;
