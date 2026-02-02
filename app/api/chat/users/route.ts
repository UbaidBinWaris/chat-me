import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getAllUsersForChat } from '@/lib/chat';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const users = await getAllUsersForChat(user.userId);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
