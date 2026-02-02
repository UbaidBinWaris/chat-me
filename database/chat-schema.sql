-- Chat System Database Schema
-- Extends the existing chat-me authentication system

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
-- Stores conversation metadata (direct chats and groups)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    name VARCHAR(255), -- Only for group chats
    description TEXT, -- Only for group chats
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- ============================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================
-- Links users to conversations (many-to-many)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_active ON conversation_participants(is_active);

-- ============================================
-- MESSAGES TABLE
-- ============================================
-- Stores all messages in the system
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    file_url TEXT,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted);

-- ============================================
-- MESSAGE REACTIONS TABLE
-- ============================================
-- Stores emoji reactions to messages
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================
-- Update conversations timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Update messages timestamp
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update conversations timestamp
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Get or Create Direct Conversation
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
    user1_id INTEGER,
    user2_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    conv_id INTEGER;
BEGIN
    -- Check if conversation exists
    SELECT c.id INTO conv_id
    FROM conversations c
    INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE c.type = 'direct'
        AND cp1.user_id = user1_id
        AND cp2.user_id = user2_id
        AND c.is_active = true
    LIMIT 1;

    -- If not exists, create new conversation
    IF conv_id IS NULL THEN
        INSERT INTO conversations (type, created_by)
        VALUES ('direct', user1_id)
        RETURNING id INTO conv_id;

        -- Add both participants
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (conv_id, user1_id), (conv_id, user2_id);
    END IF;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA
-- ============================================
-- Create a general group chat
INSERT INTO conversations (type, name, description, created_by)
VALUES ('group', 'General', 'General chat for all users', 
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add all users to the general group
INSERT INTO conversation_participants (conversation_id, user_id, role)
SELECT 
    (SELECT id FROM conversations WHERE name = 'General' AND type = 'group' LIMIT 1),
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'management' THEN 'moderator'
        ELSE 'member'
    END
FROM users u
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 'Chat system tables created successfully!' as status;

SELECT 'Conversations:' as table_name, COUNT(*) as count FROM conversations
UNION ALL
SELECT 'Participants:', COUNT(*) FROM conversation_participants
UNION ALL
SELECT 'Messages:', COUNT(*) FROM messages
UNION ALL
SELECT 'Reactions:', COUNT(*) FROM message_reactions;
