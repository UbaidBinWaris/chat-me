import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { invalidateSession } from '@/lib/session';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { session_token } = body;

    if (session_token) {
      await invalidateSession(session_token);
    }

    return NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred during logout',
      },
      { status: 500 }
    );
  }
});
