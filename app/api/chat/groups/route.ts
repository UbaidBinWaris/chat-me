import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware';
import {
  createGroupConversation,
  getAllGroups,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
} from '@/lib/chat';
import { query } from '@/lib/db';

// Get all groups (admin/management only)
export const GET = requireRole(['admin', 'management'], async (request, user) => {
  try {
    const groups = await getAllGroups();
    
    // Get participants for each group
    const groupsWithParticipants = await Promise.all(
      groups.map(async (group) => {
        const participantsResult = await query(
          `SELECT cp.*, u.username, u.full_name, u.role as user_role
           FROM conversation_participants cp
           JOIN users u ON cp.user_id = u.id
           WHERE cp.conversation_id = $1 AND cp.is_active = true`,
          [group.id]
        );
        return {
          ...group,
          participants: participantsResult.rows
        };
      })
    );
    
    return NextResponse.json({ groups: groupsWithParticipants });
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
});

// Create new group
export const POST = requireRole(['admin', 'management'], async (request, user) => {
  try {
    const body = await request.json();
    const { name, description, participant_ids } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const group = await createGroupConversation(
      {
        name,
        description,
        participant_ids: participant_ids || [],
      },
      user.userId
    );

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
});

// Update group
export const PATCH = requireRole(['admin', 'management'], async (request, user) => {
  try {
    const body = await request.json();
    const { group_id, name, description, is_active } = body;

    if (!group_id) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const group = await updateGroup(group_id, {
      name,
      description,
      is_active,
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
});

// Delete group
export const DELETE = requireRole(['admin'], async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = parseInt(searchParams.get('group_id') || '0');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    await deleteGroup(groupId);

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
});
