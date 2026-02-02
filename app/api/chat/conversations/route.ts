import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getUserConversations } from '@/lib/chat';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const conversations = await getUserConversations(user.userId);

    return NextResponse.json({
      conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
});
