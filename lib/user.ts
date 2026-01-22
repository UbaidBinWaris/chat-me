import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import {
  User,
  UserRegistrationData,
  UserResponse,
  UserRole,
} from '@/types/user';

/**
 * Create a new user
 */
export async function createUser(
  userData: UserRegistrationData
): Promise<UserResponse> {
  const { email, username, password, role = 'agent', full_name } = userData;

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Insert user into database
  const result = await query(
    `INSERT INTO users (email, username, password_hash, role, full_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, username, role, full_name, is_active, created_at, updated_at`,
    [email, username, passwordHash, role, full_name]
  );

  return result.rows[0];
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

/**
 * Find user by username
 */
export async function findUserByUsername(
  username: string
): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE username = $1', [
    username,
  ]);
  return result.rows[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: number): Promise<void> {
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [
    userId,
  ]);
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await query(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)',
    [email]
  );
  return result.rows[0].exists;
}

/**
 * Check if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await query(
    'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)',
    [username]
  );
  return result.rows[0].exists;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserResponse[]> {
  const result = await query(
    `SELECT id, email, username, role, full_name, is_active, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows;
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: number,
  role: UserRole
): Promise<UserResponse> {
  const result = await query(
    `UPDATE users SET role = $1
     WHERE id = $2
     RETURNING id, email, username, role, full_name, is_active, created_at, updated_at`,
    [role, userId]
  );
  return result.rows[0];
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateUser(userId: number): Promise<void> {
  await query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
}

/**
 * Activate user (admin only)
 */
export async function activateUser(userId: number): Promise<void> {
  await query('UPDATE users SET is_active = true WHERE id = $1', [userId]);
}
