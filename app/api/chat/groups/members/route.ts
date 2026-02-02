import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware';
import { addUserToGroup, removeUserFromGroup } from '@/lib/chat';

// Add user to group
export const POST = requireRole(['admin', 'management'], async (request, user) => {
  try {
    const body = await request.json();
    const { group_id, user_id } = body;

    if (!group_id || !user_id) {
      return NextResponse.json(
        { error: 'Group ID and User ID are required' },
        { status: 400 }
      );
    }

    await addUserToGroup(group_id, user_id);

    return NextResponse.json({
      message: 'User added to group successfully',
    });
  } catch (error) {
    console.error('Add user to group error:', error);
    return NextResponse.json(
      { error: 'Failed to add user to group' },
      { status: 500 }
    );
  }
});

// Remove user from group
export const DELETE = requireRole(['admin', 'management'], async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = parseInt(searchParams.get('group_id') || '0');
    const userId = parseInt(searchParams.get('user_id') || '0');

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'Group ID and User ID are required' },
        { status: 400 }
      );
    }

    await removeUserFromGroup(groupId, userId);

    return NextResponse.json({
      message: 'User removed from group successfully',
    });
  } catch (error) {
    console.error('Remove user from group error:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from group' },
      { status: 500 }
    );
  }
});
