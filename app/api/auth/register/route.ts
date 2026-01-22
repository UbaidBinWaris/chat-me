import { NextRequest, NextResponse } from 'next/server';
import {
  createUser,
  emailExists,
  usernameExists,
} from '@/lib/user';
import {
  ValidationError,
  ConflictError,
  validateRegistrationData,
} from '@/lib/errors';
import { UserRegistrationData } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: UserRegistrationData = await request.json();

    // Validate input data
    const validation = validateRegistrationData({
      email: body.email,
      username: body.username,
      password: body.password,
      full_name: body.full_name,
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

    // Only allow agent and management roles
    if (body.role && !['agent', 'management'].includes(body.role)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid role. Only agent and management roles are allowed.',
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailAlreadyExists = await emailExists(body.email);
    if (emailAlreadyExists) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Email already registered',
        },
        { status: 409 }
      );
    }

    // Check if username already exists
    const usernameAlreadyExists = await usernameExists(body.username);
    if (usernameAlreadyExists) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Username already taken',
        },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      email: body.email,
      username: body.username,
      password: body.password,
      role: body.role || 'agent', // Default role is agent
      full_name: body.full_name,
    });

    // Return success response (without password hash)
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: 'Conflict', message: error.message },
        { status: error.statusCode }
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Conflict', message: 'User already exists' },
        { status: 409 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred during registration',
      },
      { status: 500 }
    );
  }
}
