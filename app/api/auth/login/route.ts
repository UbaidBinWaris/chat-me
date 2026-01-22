import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateLastLogin } from '@/lib/user';
import { verifyPassword, generateTokens } from '@/lib/auth';
import {
  ValidationError,
  AuthenticationError,
  validateLoginData,
} from '@/lib/errors';
import { UserLoginData } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: UserLoginData = await request.json();

    // Validate input data
    const validation = validateLoginData({
      email: body.email,
      password: body.password,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(body.email);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          message: 'Account is deactivated',
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      body.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'Authentication Failed',
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Generate JWT tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Return success response
    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'Authentication Failed', message: error.message },
        { status: error.statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
}
