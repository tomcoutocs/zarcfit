-- ============================================
-- TRAINER PLATFORM SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. USER ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- RLS Policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can insert roles" ON user_roles;
CREATE POLICY "Only admins can insert roles"
ON user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 2. TRAINER PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  bio TEXT,
  specializations TEXT[],
  certifications TEXT[],
  years_experience INTEGER,
  phone TEXT,
  website TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'past_due')) DEFAULT 'trial',
  max_clients INTEGER DEFAULT 5,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainer_profiles_subscription_status ON trainer_profiles(subscription_status);

-- RLS Policies
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their own profile" ON trainer_profiles;
CREATE POLICY "Trainers can view their own profile"
ON trainer_profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Trainers can update their own profile" ON trainer_profiles;
CREATE POLICY "Trainers can update their own profile"
ON trainer_profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view active trainer profiles" ON trainer_profiles;
CREATE POLICY "Anyone can view active trainer profiles"
ON trainer_profiles FOR SELECT
USING (is_active = true);

-- ============================================
-- 3. TRAINER-CLIENT RELATIONSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'active', 'paused', 'terminated')) DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  terminated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainer_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_clients_trainer ON trainer_clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_client ON trainer_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_status ON trainer_clients(status);

-- RLS Policies
ALTER TABLE trainer_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their client relationships" ON trainer_clients;
CREATE POLICY "Trainers can view their client relationships"
ON trainer_clients FOR SELECT
USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Clients can view their trainer relationships" ON trainer_clients;
CREATE POLICY "Clients can view their trainer relationships"
ON trainer_clients FOR SELECT
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can insert client relationships" ON trainer_clients;
CREATE POLICY "Trainers can insert client relationships"
ON trainer_clients FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their client relationships" ON trainer_clients;
CREATE POLICY "Trainers can update their client relationships"
ON trainer_clients FOR UPDATE
USING (auth.uid() = trainer_id);

-- ============================================
-- 4. CLIENT INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  first_name TEXT,
  last_name TEXT,
  personal_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_client_invitations_trainer ON client_invitations(trainer_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);

-- RLS Policies
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their invitations" ON client_invitations;
CREATE POLICY "Trainers can view their invitations"
ON client_invitations FOR SELECT
USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can create invitations" ON client_invitations;
CREATE POLICY "Trainers can create invitations"
ON client_invitations FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their invitations" ON client_invitations;
CREATE POLICY "Trainers can update their invitations"
ON client_invitations FOR UPDATE
USING (auth.uid() = trainer_id);

-- ============================================
-- 5. TRAINER SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_settings (
  trainer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  default_session_duration INTEGER DEFAULT 60,
  booking_buffer INTEGER DEFAULT 30,
  working_hours JSONB DEFAULT '{}',
  auto_accept_clients BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE trainer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can manage their settings" ON trainer_settings;
CREATE POLICY "Trainers can manage their settings"
ON trainer_settings FOR ALL
USING (auth.uid() = trainer_id);

-- ============================================
-- 6. CLIENT NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT CHECK (note_type IN ('general', 'injury', 'preference', 'goal', 'achievement')) DEFAULT 'general',
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_trainer ON client_notes(trainer_id);

-- RLS Policies
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can manage notes for their clients" ON client_notes;
CREATE POLICY "Trainers can manage notes for their clients"
ON client_notes FOR ALL
USING (
  auth.uid() = trainer_id AND
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = client_notes.client_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- 7. CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainer_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_trainer ON conversations(trainer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their conversations" ON conversations;
CREATE POLICY "Trainers can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Clients can view their conversations" ON conversations;
CREATE POLICY "Clients can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = client_id);

-- NOTE: the policies below were missing from the original schema, which
-- meant `messagingApi.getOrCreateConversation` and `markAsRead` would be
-- silently blocked by RLS with no INSERT/UPDATE policy to satisfy.
-- See messaging-access.sql for the current split trainer/client policies.
DROP POLICY IF EXISTS "Trainer-client pairs can start a conversation" ON conversations;
DROP POLICY IF EXISTS "Trainers can start conversations with active clients" ON conversations;
DROP POLICY IF EXISTS "Clients can start conversations with their trainer" ON conversations;

-- ============================================
-- 8. MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can view messages" ON messages;
CREATE POLICY "Conversation participants can view messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.trainer_id = auth.uid() OR c.client_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Conversation participants can send messages" ON messages;
DROP POLICY IF EXISTS "Trainers can send messages to their clients" ON messages;
DROP POLICY IF EXISTS "Clients can send messages to their trainer" ON messages;
-- See messaging-access.sql for the current split trainer/client policies.

-- Needed so a recipient can mark the other participant's messages as read.
DROP POLICY IF EXISTS "Conversation participants can mark messages read" ON messages;
CREATE POLICY "Conversation participants can mark messages read"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.trainer_id = auth.uid() OR c.client_id = auth.uid())
  )
);

-- ============================================
-- 9. PROGRAM ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS program_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_assignments_client ON program_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_program ON program_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_status ON program_assignments(status);

-- RLS Policies
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their assignments" ON program_assignments;
CREATE POLICY "Clients can view their assignments"
ON program_assignments FOR SELECT
USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can view assignments for their clients" ON program_assignments;
CREATE POLICY "Trainers can view assignments for their clients"
ON program_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = program_assignments.client_id
    AND tc.status = 'active'
  )
);

DROP POLICY IF EXISTS "Trainers can create assignments for their clients" ON program_assignments;
CREATE POLICY "Trainers can create assignments for their clients"
ON program_assignments FOR INSERT
WITH CHECK (
  auth.uid() = assigned_by AND
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = program_assignments.client_id
    AND tc.status = 'active'
  )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trainer's clients
CREATE OR REPLACE FUNCTION get_trainer_clients(trainer_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  client_id UUID,
  client_email TEXT,
  client_name TEXT,
  status TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.client_id,
    u.email,
    COALESCE(up.first_name || ' ' || up.last_name, u.email) as client_name,
    tc.status,
    tc.accepted_at
  FROM trainer_clients tc
  JOIN auth.users u ON u.id = tc.client_id
  LEFT JOIN user_profiles up ON up.id = tc.client_id
  WHERE tc.trainer_id = trainer_uuid
  AND tc.status IN ('active', 'pending')
  ORDER BY tc.accepted_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Automatically create trainer profile when trainer role is assigned
CREATE OR REPLACE FUNCTION create_trainer_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'trainer' THEN
    INSERT INTO trainer_profiles (id)
    VALUES (NEW.user_id)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO trainer_settings (trainer_id)
    VALUES (NEW.user_id)
    ON CONFLICT (trainer_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trainer_role_assigned ON user_roles;
CREATE TRIGGER on_trainer_role_assigned
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION create_trainer_profile();

-- Update conversation last_message_at when message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_sent ON messages;
CREATE TRIGGER on_message_sent
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
