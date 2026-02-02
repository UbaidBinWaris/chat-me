import { query } from './db';
import * as crypto from 'crypto';

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  device_info?: string;
  ip_address?: string;
  created_at: Date;
  last_activity: Date;
  expires_at: Date;
  is_active: boolean;
}

// Generate unique session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create new session (invalidates existing sessions for the user)
export async function createSession(
  userId: number,
  deviceInfo?: string,
  ipAddress?: string
): Promise<Session> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // First, invalidate any existing active sessions for this user
  await query(
    `UPDATE user_sessions 
     SET is_active = false 
     WHERE user_id = $1 AND is_active = true`,
    [userId]
  );

  // Create new session
  const result = await query(
    `INSERT INTO user_sessions (user_id, session_token, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, sessionToken, deviceInfo, ipAddress, expiresAt]
  );

  return result.rows[0];
}

// Verify session is valid
export async function verifySession(sessionToken: string): Promise<Session | null> {
  const result = await query(
    `SELECT * FROM user_sessions
     WHERE session_token = $1 
       AND is_active = true 
       AND expires_at > CURRENT_TIMESTAMP`,
    [sessionToken]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Update last activity
  await query(
    `UPDATE user_sessions 
     SET last_activity = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [result.rows[0].id]
  );

  return result.rows[0];
}

// Invalidate session (logout)
export async function invalidateSession(sessionToken: string): Promise<void> {
  await query(
    `UPDATE user_sessions 
     SET is_active = false 
     WHERE session_token = $1`,
    [sessionToken]
  );
}

// Invalidate all sessions for a user
export async function invalidateAllUserSessions(userId: number): Promise<void> {
  await query(
    `UPDATE user_sessions 
     SET is_active = false 
     WHERE user_id = $1`,
    [userId]
  );
}

// Get active session for user
export async function getActiveSession(userId: number): Promise<Session | null> {
  const result = await query(
    `SELECT * FROM user_sessions
     WHERE user_id = $1 
       AND is_active = true 
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await query(
    `UPDATE user_sessions 
     SET is_active = false 
     WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true`
  );
}
