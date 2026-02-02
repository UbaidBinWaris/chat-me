export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  file_url?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  sender?: {
    id: number;
    username: string;
    full_name?: string;
    role: string;
  };
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  role: 'admin' | 'moderator' | 'member';
  joined_at: Date;
  last_read_at?: Date;
  is_active: boolean;
  user?: {
    id: number;
    username: string;
    full_name?: string;
    email: string;
    role: string;
  };
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: Date;
}

export interface SendMessageData {
  conversation_id: number;
  content: string;
  message_type?: 'text' | 'file' | 'image';
  file_url?: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  participant_ids: number[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  is_active?: boolean;
}
