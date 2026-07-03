# Migration Guide: Consumer App → Trainer Platform

This guide provides step-by-step instructions to transform ZarcoFit from a consumer fitness app into a trainer-client management platform.

---

## Overview

**Approach:** Additive migration (minimize breaking changes)
**Strategy:** Build new features alongside existing, then gradually transition
**Timeline:** 6-8 weeks for MVP

---

## Phase 1: Database Foundation (Week 1)

### Step 1.1: Create New Database Schema

Create a new file: `src/lib/supabase/trainer-platform-schema.sql`

```sql
-- ============================================
-- TRAINER PLATFORM SCHEMA
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

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS Policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
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

CREATE INDEX idx_trainer_profiles_subscription_status ON trainer_profiles(subscription_status);

-- RLS Policies
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their own profile"
ON trainer_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Trainers can update their own profile"
ON trainer_profiles FOR UPDATE
USING (auth.uid() = id);

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

CREATE INDEX idx_trainer_clients_trainer ON trainer_clients(trainer_id);
CREATE INDEX idx_trainer_clients_client ON trainer_clients(client_id);
CREATE INDEX idx_trainer_clients_status ON trainer_clients(status);

-- RLS Policies
ALTER TABLE trainer_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their client relationships"
ON trainer_clients FOR SELECT
USING (auth.uid() = trainer_id);

CREATE POLICY "Clients can view their trainer relationships"
ON trainer_clients FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Trainers can insert client relationships"
ON trainer_clients FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

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

CREATE INDEX idx_client_invitations_trainer ON client_invitations(trainer_id);
CREATE INDEX idx_client_invitations_token ON client_invitations(token);
CREATE INDEX idx_client_invitations_email ON client_invitations(email);

-- RLS Policies
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their invitations"
ON client_invitations FOR SELECT
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can create invitations"
ON client_invitations FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

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

CREATE INDEX idx_client_notes_client ON client_notes(client_id);
CREATE INDEX idx_client_notes_trainer ON client_notes(trainer_id);

-- RLS Policies
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_conversations_trainer ON conversations(trainer_id);
CREATE INDEX idx_conversations_client ON conversations(client_id);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = trainer_id);

CREATE POLICY "Clients can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = client_id);

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

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.trainer_id = auth.uid() OR c.client_id = auth.uid())
  )
);

CREATE POLICY "Conversation participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
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

CREATE INDEX idx_program_assignments_client ON program_assignments(client_id);
CREATE INDEX idx_program_assignments_program ON program_assignments(program_id);
CREATE INDEX idx_program_assignments_status ON program_assignments(status);

-- RLS Policies
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their assignments"
ON program_assignments FOR SELECT
USING (auth.uid() = client_id);

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
CREATE OR REPLACE FUNCTION get_trainer_clients(trainer_uuid UUID)
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

CREATE TRIGGER on_message_sent
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
```

### Step 1.2: Run the Migration

```bash
# In Supabase SQL Editor, run the trainer-platform-schema.sql file
```

### Step 1.3: Update Existing Table RLS Policies

Create file: `src/lib/supabase/update-rls-policies.sql`

```sql
-- ============================================
-- UPDATE RLS POLICIES FOR TRAINER ACCESS
-- ============================================

-- Drop existing restrictive policies and add trainer access

-- WORKOUT PROGRAMS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON workout_programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON workout_programs;

CREATE POLICY "Users can view their own programs"
ON workout_programs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' programs"
ON workout_programs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_programs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can insert their own programs"
ON workout_programs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can insert programs for clients"
ON workout_programs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_programs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can update their own programs"
ON workout_programs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can update their clients' programs"
ON workout_programs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_programs.user_id
    AND tc.status = 'active'
  )
);

CREATE POLICY "Users can delete their own programs"
ON workout_programs FOR DELETE
USING (auth.uid() = user_id);

-- Apply similar pattern to other tables
-- Copy and adapt for:
-- - workout_logs
-- - nutrition_plans
-- - meal_plans
-- - meals
-- - progress_tracking
-- - goals
-- - sleep_tracking
-- - calendar_events

-- Example for workout_logs:
DROP POLICY IF EXISTS "Users can view their own workout logs" ON workout_logs;

CREATE POLICY "Users can view their own workout logs"
ON workout_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients' workout logs"
ON workout_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_logs.user_id
    AND tc.status = 'active'
  )
);

-- Continue for all tables...
```

---

## Phase 2: Authentication & Role Management (Week 2)

### Step 2.1: Update Auth Context

Update `src/context/auth-context.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type UserRole = 'admin' | 'trainer' | 'client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isTrainer: boolean;
  isClient: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isTrainer: false,
  isClient: false,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    return data?.role as UserRole | null;
  };

  const refreshRole = async () => {
    if (user) {
      const userRole = await fetchUserRole(user.id);
      setRole(userRole);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        setRole(userRole);
      }
      
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isTrainer: role === 'trainer',
        isClient: role === 'client',
        isAdmin: role === 'admin',
        loading,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Step 2.2: Update Signup Flow

Update `src/app/auth/signup/page.tsx`:

Add role selection:

```typescript
const [role, setRole] = useState<'trainer' | 'client'>('client');

// In the form:
<div className="space-y-2">
  <Label>I am a...</Label>
  <div className="grid grid-cols-2 gap-4">
    <Button
      type="button"
      variant={role === 'client' ? 'default' : 'outline'}
      onClick={() => setRole('client')}
    >
      Client
    </Button>
    <Button
      type="button"
      variant={role === 'trainer' ? 'default' : 'outline'}
      onClick={() => setRole('trainer')}
    >
      Trainer/Coach
    </Button>
  </div>
</div>

// After signup success:
const { data: { user } } = await supabase.auth.signUp({...});

if (user) {
  // Assign role
  await supabase.from('user_roles').insert({
    user_id: user.id,
    role: role
  });
  
  // Redirect based on role
  if (role === 'trainer') {
    router.push('/trainer/onboarding');
  } else {
    router.push('/client/dashboard');
  }
}
```

### Step 2.3: Create Middleware for Route Protection

Create `src/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Public routes
  if (req.nextUrl.pathname.startsWith('/auth') || 
      req.nextUrl.pathname.startsWith('/main') ||
      req.nextUrl.pathname === '/') {
    return res
  }
  
  // Require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  
  // Get user role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()
  
  const path = req.nextUrl.pathname
  const role = userRole?.role
  
  // Role-based routing
  if (path.startsWith('/trainer') && role !== 'trainer') {
    return NextResponse.redirect(new URL('/client/dashboard', req.url))
  }
  
  if (path.startsWith('/client') && role !== 'client') {
    return NextResponse.redirect(new URL('/trainer/dashboard', req.url))
  }
  
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Redirect /dashboard to role-specific dashboard
  if (path === '/dashboard') {
    if (role === 'trainer') {
      return NextResponse.redirect(new URL('/trainer/dashboard', req.url))
    } else if (role === 'client') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url))
    }
  }
  
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

---

## Phase 3: Trainer Dashboard & Core Features (Week 3-5)

See TRAINER_PLATFORM_RESTRUCTURE.md for detailed component specifications.

### Quick Implementation Order:

1. **Trainer Dashboard** (`/trainer/dashboard/page.tsx`)
2. **Client List** (`/trainer/clients/page.tsx`)
3. **Invite Client** (`/trainer/clients/add/page.tsx`)
4. **Client Detail View** (`/trainer/clients/[clientId]/page.tsx`)
5. **Program Assignment** 
6. **Messaging System**

---

## Testing Checklist

### Manual Testing

- [ ] Sign up as trainer
- [ ] Sign up as client
- [ ] Trainer invites client
- [ ] Client accepts invitation
- [ ] Trainer views client data
- [ ] Trainer assigns program
- [ ] Client sees assigned program
- [ ] Messaging between trainer-client
- [ ] RLS policies prevent unauthorized access

---

This migration guide provides the SQL and code foundation. Refer to TRAINER_PLATFORM_RESTRUCTURE.md for complete feature specifications and UI mockups.
