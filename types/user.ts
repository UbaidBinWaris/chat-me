export type UserRole = 'admin' | 'management' | 'agent';

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
  full_name?: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
