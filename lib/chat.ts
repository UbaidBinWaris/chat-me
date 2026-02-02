import { query } from '@/lib/db';
import {
  Conversation,
  ConversationParticipant,
  Message,
  SendMessageData,
  CreateGroupData,
} from '@/types/chat';

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: number
): Promise<Conversation[]> {
  const result = await query(
    `SELECT DISTINCT ON (c.id)
      c.*,
      (
        SELECT json_agg(json_build_object(
          'id', cp.id,
          'user_id', cp.user_id,
          'role', cp.role,
          'username', u.username,
          'full_name', u.full_name,
          'user_role', u.role
        ))
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = c.id AND cp.is_active = true
      ) as participants,
      (
        SELECT json_build_object(
          'id', m.id,
          'content', m.content,
          'sender_id', m.sender_id,
          'sender_username', u.username,
          'created_at', m.created_at
        )
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = c.id AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as last_message,
      (
        SELECT COUNT(*)
        FROM messages m
        LEFT JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE m.conversation_id = c.id
          AND cp.user_id = $1
          AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
          AND m.is_deleted = false
          AND m.sender_id != $1
      ) as unread_count
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = $1 AND cp.is_active = true AND c.is_active = true
    ORDER BY c.id, c.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateDirectConversation(
  user1Id: number,
  user2Id: number
): Promise<number> {
  const result = await query(
    'SELECT get_or_create_direct_conversation($1, $2) as conversation_id',
    [user1Id, user2Id]
  );
  return result.rows[0].conversation_id;
}

/**
 * Create a group conversation
 */
export async function createGroupConversation(
  data: CreateGroupData,
  createdBy: number
): Promise<Conversation> {
  const { name, description, participant_ids } = data;

  // Create conversation
  const convResult = await query(
    `INSERT INTO conversations (type, name, description, created_by)
     VALUES ('group', $1, $2, $3)
     RETURNING *`,
    [name, description, createdBy]
  );

  const conversation = convResult.rows[0];

  // Add creator as admin
  await query(
    `INSERT INTO conversation_participants (conversation_id, user_id, role)
     VALUES ($1, $2, 'admin')`,
    [conversation.id, createdBy]
  );

  // Add other participants
  if (participant_ids && participant_ids.length > 0) {
    const values = participant_ids
      .filter((id) => id !== createdBy)
      .map((id, index) => `($1, $${index + 2}, 'member')`)
      .join(', ');

    if (values) {
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES ${values}`,
        [conversation.id, ...participant_ids.filter((id) => id !== createdBy)]
      );
    }
  }

  return conversation;
}

/**
 * Get messages in a conversation
 */
export async function getConversationMessages(
  conversationId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  const result = await query(
    `SELECT 
      m.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'full_name', u.full_name,
        'role', u.role
      ) as sender
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1 AND m.is_deleted = false
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );
  return result.rows.reverse(); // Return in chronological order
}

/**
 * Send a message
 */
export async function sendMessage(
  data: SendMessageData,
  senderId: number
): Promise<Message> {
  const { conversation_id, content, message_type = 'text', file_url } = data;

  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type, file_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [conversation_id, senderId, content, message_type, file_url]
  );

  return result.rows[0];
}

/**
 * Update last read timestamp for a user in a conversation
 */
export async function updateLastRead(
  conversationId: number,
  userId: number
): Promise<void> {
  await query(
    `UPDATE conversation_participants
     SET last_read_at = CURRENT_TIMESTAMP
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
}

/**
 * Get all users (for selecting participants)
 */
export async function getAllUsersForChat(
  excludeUserId?: number
): Promise<any[]> {
  const result = await query(
    `SELECT id, email, username, full_name, role
     FROM users
     WHERE is_active = true ${excludeUserId ? 'AND id != $1' : ''}
     ORDER BY username`,
    excludeUserId ? [excludeUserId] : []
  );
  return result.rows;
}

/**
 * Check if user is participant in conversation
 */
export async function isUserInConversation(
  conversationId: number,
  userId: number
): Promise<boolean> {
  const result = await query(
    `SELECT EXISTS(
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2 AND is_active = true
    )`,
    [conversationId, userId]
  );
  return result.rows[0].exists;
}

/**
 * Get conversation details
 */
export async function getConversationById(
  conversationId: number
): Promise<Conversation | null> {
  const result = await query(
    `SELECT c.*,
      (
        SELECT json_agg(json_build_object(
          'id', cp.id,
          'user_id', cp.user_id,
          'role', cp.role,
          'username', u.username,
          'full_name', u.full_name,
          'email', u.email,
          'user_role', u.role
        ))
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = c.id AND cp.is_active = true
      ) as participants
    FROM conversations c
    WHERE c.id = $1`,
    [conversationId]
  );
  return result.rows[0] || null;
}

/**
 * Add user to group (admin only)
 */
export async function addUserToGroup(
  conversationId: number,
  userId: number
): Promise<void> {
  await query(
    `INSERT INTO conversation_participants (conversation_id, user_id, role)
     VALUES ($1, $2, 'member')
     ON CONFLICT (conversation_id, user_id) 
     DO UPDATE SET is_active = true`,
    [conversationId, userId]
  );
}

/**
 * Remove user from group (admin only)
 */
export async function removeUserFromGroup(
  conversationId: number,
  userId: number
): Promise<void> {
  await query(
    `UPDATE conversation_participants
     SET is_active = false
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
}

/**
 * Update group details (admin only)
 */
export async function updateGroup(
  conversationId: number,
  data: { name?: string; description?: string; is_active?: boolean }
): Promise<Conversation> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description);
  }
  if (data.is_active !== undefined) {
    updates.push(`is_active = $${paramCount++}`);
    values.push(data.is_active);
  }

  values.push(conversationId);

  const result = await query(
    `UPDATE conversations
     SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Delete group (admin only)
 */
export async function deleteGroup(conversationId: number): Promise<void> {
  await query(
    `UPDATE conversations SET is_active = false WHERE id = $1`,
    [conversationId]
  );
}

/**
 * Get all groups (admin only)
 */
export async function getAllGroups(): Promise<Conversation[]> {
  const result = await query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND is_active = true) as member_count,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_deleted = false) as message_count
    FROM conversations c
    WHERE c.type = 'group'
    ORDER BY c.created_at DESC`
  );
  return result.rows;
}
