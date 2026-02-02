import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import {
  getConversationMessages,
  sendMessage,
  updateLastRead,
  isUserInConversation,
} from '@/lib/chat';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = parseInt(searchParams.get('conversation_id') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Check if user is participant
    const isParticipant = await isUserInConversation(
      conversationId,
      user.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to view this conversation' },
        { status: 403 }
      );
    }

    const messages = await getConversationMessages(
      conversationId,
      limit,
      offset
    );

    // Update last read
    await updateLastRead(conversationId, user.userId);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { conversation_id, content, message_type, file_url } = body;

    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    // Check if user is participant
    const isParticipant = await isUserInConversation(
      conversation_id,
      user.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to send messages in this conversation' },
        { status: 403 }
      );
    }

    const message = await sendMessage(
      {
        conversation_id,
        content,
        message_type,
        file_url,
      },
      user.userId
    );

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
});
