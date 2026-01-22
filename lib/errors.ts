/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

/**
 * Validation helper functions
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function isValidUsername(username: string): boolean {
  // 3-30 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

export function validateRegistrationData(data: {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.username) {
    errors.push('Username is required');
  } else if (!isValidUsername(data.username)) {
    errors.push(
      'Username must be 3-30 characters and contain only letters, numbers, and underscores'
    );
  }

  if (!data.password) {
    errors.push('Password is required');
  } else if (!isValidPassword(data.password)) {
    errors.push(
      'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
    );
  }

  if (data.full_name && data.full_name.length > 255) {
    errors.push('Full name must be less than 255 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginData(data: {
  email: string;
  password: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
