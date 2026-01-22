import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    return NextResponse.json(
      {
        message: 'User profile retrieved successfully',
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred while fetching profile',
      },
      { status: 500 }
    );
  }
});
