import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateLastLogin } from '@/lib/user';
import { verifyPassword, generateTokens } from '@/lib/auth';
import { createSession, getActiveSession, generateSessionToken } from '@/lib/session';
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

    // Check for existing active session - enforce single login
    const existingSession = await getActiveSession(user.id);
    if (existingSession) {
      return NextResponse.json(
        {
          error: 'Already Logged In',
          message: 'You are already logged in from another browser or device. Please logout from the other session first.',
          session: {
            created_at: existingSession.created_at,
            last_activity: existingSession.last_activity,
          }
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Get device and IP info
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined;

    // Create new session (automatically invalidates any existing sessions)
    const session = await createSession(user.id, userAgent, ipAddress);

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
        session: {
          token: session.session_token,
          expires_at: session.expires_at,
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
