import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getOrCreateDirectConversation } from '@/lib/chat';

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    // Accept both field names for compatibility
    const targetUserId = body.other_user_id || body.user_id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (targetUserId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    const conversationId = await getOrCreateDirectConversation(
      user.userId,
      targetUserId
    );

    return NextResponse.json({ conversation_id: conversationId });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
});
