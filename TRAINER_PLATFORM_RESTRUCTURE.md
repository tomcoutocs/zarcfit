# ZarcoFit: Restructuring for Trainer-Client Management Platform

## Executive Summary

**Current State:** Consumer fitness tracking app (B2C)  
**Target State:** Trainer management platform (B2B2C)  
**Business Model:** Trainers pay subscription, clients use for free (or freemium model)

This document outlines the complete restructuring needed to transform ZarcoFit into a platform where trainers manage their clients.

---

## New Platform Architecture

### User Roles & Hierarchy

```
Platform Admin (Super Admin)
    │
    ├── Trainer (Coach/Business Owner)
    │   ├── Client 1
    │   ├── Client 2
    │   └── Client N
    │
    └── Trainer 2
        ├── Client A
        └── Client B
```

### Role Capabilities

#### 1. **Platform Admin**
- Manage all trainers
- Platform analytics
- Billing management
- Content moderation
- System configuration

#### 2. **Trainer (Primary User)**
- Manage client roster
- View all client data (workouts, meals, progress, sleep)
- Create and assign workout programs
- Create and assign meal plans
- Message clients
- Track client progress
- Generate client reports
- Manage their business profile
- Calendar/scheduling with clients
- Set client goals
- Receive notifications for client activity

#### 3. **Client (End User)**
- Log workouts, meals, sleep, progress
- View assigned programs
- Message their trainer
- Track their own progress
- View their calendar/schedule
- **Cannot** see other clients' data
- **Cannot** create programs (only assigned by trainer)

---

## Database Schema Changes

### New Tables Required

#### 1. User Roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- User can have multiple roles (e.g., trainer who is also a client of another trainer)
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

#### 2. Trainer Profiles Table
```sql
CREATE TABLE trainer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  bio TEXT,
  specializations TEXT[], -- e.g., ['strength training', 'nutrition', 'weight loss']
  certifications TEXT[],
  years_experience INTEGER,
  phone TEXT,
  website TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'past_due')),
  max_clients INTEGER DEFAULT 10, -- Based on subscription tier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Trainer-Client Relationship Table
```sql
CREATE TABLE trainer_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'active', 'paused', 'terminated')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Trainer's private notes about client
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainer_id, client_id)
);

CREATE INDEX idx_trainer_clients_trainer ON trainer_clients(trainer_id);
CREATE INDEX idx_trainer_clients_client ON trainer_clients(client_id);
CREATE INDEX idx_trainer_clients_status ON trainer_clients(status);
```

#### 4. Client Invitations Table
```sql
CREATE TABLE client_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_client_invitations_trainer ON client_invitations(trainer_id);
CREATE INDEX idx_client_invitations_token ON client_invitations(token);
```

#### 5. Trainer Business Settings
```sql
CREATE TABLE trainer_settings (
  trainer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  default_session_duration INTEGER DEFAULT 60, -- minutes
  booking_buffer INTEGER DEFAULT 30, -- minutes between sessions
  working_hours JSONB, -- e.g., {"monday": {"start": "09:00", "end": "17:00"}}
  auto_accept_clients BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. Client Notes/Observations (Trainer's Private Notes)
```sql
CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT CHECK (note_type IN ('general', 'injury', 'preference', 'goal', 'achievement')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_client_notes_client ON client_notes(client_id);
CREATE INDEX idx_client_notes_trainer ON client_notes(trainer_id);
```

#### 7. Messages/Communication
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainer_id, client_id)
);

CREATE TABLE messages (
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
```

### Modified Existing Tables

All existing tables need an additional consideration for trainer access:

#### Update RLS Policies

**Current:** Users can only see their own data  
**New:** Users can see their own data + Trainers can see their clients' data

Example for `workout_logs`:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own workout logs" ON workout_logs;

-- New policies
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

-- Trainers can create logs on behalf of clients
CREATE POLICY "Trainers can create workout logs for clients"
ON workout_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.trainer_id = auth.uid()
    AND tc.client_id = workout_logs.user_id
    AND tc.status = 'active'
  )
);
```

**Apply similar pattern to ALL data tables:**
- workout_programs
- workout_logs
- nutrition_plans
- meals
- progress_tracking
- goals
- sleep_tracking
- calendar_events

### Program Assignment Table

```sql
CREATE TABLE program_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id), -- trainer who assigned it
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, client_id)
);
```

---

## Application Structure Restructure

### New Route Organization

```
/
├── /auth
│   ├── /login
│   ├── /signup (with role selection)
│   ├── /forgot-password
│   └── /accept-invitation (for clients)
│
├── /trainer (Protected - Trainer role only)
│   ├── /dashboard (Overview of all clients)
│   ├── /clients
│   │   ├── /list (All clients)
│   │   ├── /add (Invite new client)
│   │   └── /[clientId]
│   │       ├── /overview
│   │       ├── /workouts
│   │       ├── /nutrition
│   │       ├── /progress
│   │       ├── /goals
│   │       ├── /schedule
│   │       └── /chat
│   ├── /programs
│   │   ├── /library (All programs)
│   │   ├── /create
│   │   └── /[programId]
│   ├── /templates
│   │   ├── /workout-templates
│   │   └── /meal-templates
│   ├── /schedule (Calendar for all clients)
│   ├── /messages (All client conversations)
│   ├── /reports (Analytics across clients)
│   ├── /settings
│   │   ├── /profile
│   │   ├── /business
│   │   ├── /billing
│   │   └── /notifications
│   └── /onboarding (First-time setup wizard)
│
├── /client (Protected - Client role)
│   ├── /dashboard (Current implementation, mostly unchanged)
│   ├── /workouts
│   ├── /meals
│   ├── /progress
│   ├── /goals
│   ├── /schedule
│   ├── /chat (with their trainer)
│   └── /profile
│
├── /admin (Protected - Admin role)
│   ├── /trainers
│   ├── /users
│   ├── /analytics
│   └── /settings
│
└── /main (Marketing site - unchanged)
```

### Role-Based Routing

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
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
  
  // Protect trainer routes
  if (path.startsWith('/trainer') && userRole?.role !== 'trainer') {
    return NextResponse.redirect(new URL('/client/dashboard', req.url))
  }
  
  // Protect client routes
  if (path.startsWith('/client') && userRole?.role !== 'client') {
    return NextResponse.redirect(new URL('/trainer/dashboard', req.url))
  }
  
  // Protect admin routes
  if (path.startsWith('/admin') && userRole?.role !== 'admin') {
    return NextResponse.redirect(new URL('/client/dashboard', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/trainer/:path*', '/client/:path*', '/admin/:path*']
}
```

---

## Key Features to Build

### Priority 1: Trainer Core Features

#### 1. Trainer Dashboard
```typescript
// src/app/trainer/dashboard/page.tsx

- Client overview grid (all clients at a glance)
- Quick stats per client
  - Last workout logged
  - Meal adherence
  - Progress photos
  - Upcoming sessions
- Recent activity feed across all clients
- Clients needing attention (missed workouts, etc.)
- Today's schedule
- Quick actions (message client, add workout, etc.)
```

#### 2. Client Management
```typescript
// src/app/trainer/clients/page.tsx

- List all clients
- Filter by status (active, paused, pending)
- Search clients
- Sort by various metrics
- Quick actions per client
- Invite new client flow

// src/app/trainer/clients/[clientId]/page.tsx

- Client profile overview
- Progress charts
- Recent activity
- Assigned programs
- Communication history
- Private notes
- Action buttons (assign program, message, schedule session)
```

#### 3. Client Invitation System
```typescript
// src/app/trainer/clients/add/page.tsx

- Enter client email
- Optional: Pre-fill client info
- Send invitation email
- Track invitation status
- Resend/cancel invitations

// src/app/auth/accept-invitation/page.tsx (Client side)

- Validate invitation token
- Client signup form
- Automatic linking to trainer
- Redirect to client dashboard
```

#### 4. Program Creation & Assignment
```typescript
// src/app/trainer/programs/create/page.tsx

- Create workout programs
- Build workout sessions
- Add exercises with sets/reps
- Save as template
- Assign to multiple clients
- Clone existing programs

// src/app/trainer/clients/[clientId]/workouts/page.tsx

- View client's current programs
- Assign new programs
- View workout logs
- Add workouts manually
- See progress on exercises
```

#### 5. Client Progress Monitoring
```typescript
// src/app/trainer/clients/[clientId]/progress/page.tsx

- Weight/measurement charts
- Progress photos timeline
- Body composition trends
- Compare multiple metrics
- Add measurements on behalf of client
- Export reports
```

### Priority 2: Client Features (Modified)

#### Key Changes for Client Experience:

1. **Programs are Assigned** (not created)
   - Clients see programs assigned by trainer
   - Can't create own programs
   - Can still log workouts

2. **Trainer Communication**
   - Direct chat with trainer
   - Notifications when trainer messages
   - Share progress updates

3. **Simplified Navigation**
   - Focus on logging and tracking
   - Less emphasis on program creation

### Priority 3: Communication System

```typescript
// Real-time messaging using Supabase Realtime

// src/app/trainer/messages/page.tsx
- List all client conversations
- Unread message badges
- Quick reply
- Message history

// src/app/client/chat/page.tsx
- Single conversation with trainer
- Real-time updates
- File attachments (progress photos)
```

---

## User Flows

### Trainer Onboarding Flow

1. **Sign up as Trainer**
   - Email/password or OAuth
   - Select "I'm a Trainer" role
   - Enter business information
   - Choose subscription tier

2. **Complete Profile**
   - Business name
   - Certifications
   - Specializations
   - Profile photo

3. **Invite First Client**
   - Guided tutorial
   - Send invitation
   - Wait for acceptance

4. **Create First Program**
   - Template library
   - Build custom program
   - Assign to client

### Client Onboarding Flow

1. **Receive Invitation Email**
   - Click invitation link
   - Lands on signup page

2. **Create Account**
   - Email/password
   - Basic information
   - Profile setup

3. **Automatic Linking**
   - Linked to trainer automatically
   - See assigned program (if any)
   - Start logging

---

## Data Access Patterns

### Trainer Accessing Client Data

```typescript
// Hook: useTrainerClient.ts
export function useTrainerClient(clientId: string) {
  // Verify trainer-client relationship
  // Fetch client data
  // Return with proper permissions
}

// API: /api/trainer/clients/[clientId]
// Verify caller is trainer
// Verify relationship exists
// Return client data
```

### Security Considerations

1. **Always verify relationships**
   - Don't trust client-side role checks
   - Server-side validation on every request
   - RLS policies as last line of defense

2. **Audit logging**
   - Log when trainers access client data
   - Track program assignments
   - Monitor for suspicious activity

3. **Data privacy**
   - Trainers can't share client data
   - Export controls
   - GDPR compliance

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create new database tables
- [ ] Update RLS policies
- [ ] Add role-based authentication
- [ ] Create middleware for route protection
- [ ] Build role context provider

### Phase 2: Trainer Core (Week 3-5)
- [ ] Trainer dashboard
- [ ] Client list/management
- [ ] Client invitation system
- [ ] Basic client detail view
- [ ] Program assignment

### Phase 3: Client Modifications (Week 6-7)
- [ ] Update client dashboard
- [ ] Show assigned programs
- [ ] Restrict program creation
- [ ] Update workout logging
- [ ] Update meal logging

### Phase 4: Communication (Week 8-9)
- [ ] Real-time messaging
- [ ] Notifications
- [ ] Activity feed
- [ ] Email notifications

### Phase 5: Advanced Features (Week 10-12)
- [ ] Progress monitoring
- [ ] Reports/analytics
- [ ] Calendar/scheduling
- [ ] Billing integration
- [ ] Mobile optimization

### Phase 6: Polish & Testing (Week 13-14)
- [ ] Testing all user flows
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation

---

## Migration Strategy

### For Existing Users

If you already have users in the current system:

```sql
-- Migrate existing users to "client" role
INSERT INTO user_roles (user_id, role)
SELECT id, 'client'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.users.id
);

-- Existing workout_programs become templates
-- owned by the platform or assigned to users as clients
```

---

## Subscription & Pricing Models

### Recommended Tiers

**Free Tier**
- Up to 5 clients
- Basic features
- Email support

**Pro Tier** ($29/month)
- Up to 25 clients
- All features
- Priority support
- Custom branding

**Enterprise Tier** ($99/month)
- Unlimited clients
- API access
- White label
- Dedicated support

### Implementation

```typescript
// Use Stripe for payments
// src/app/trainer/settings/billing/page.tsx

- View current plan
- Upgrade/downgrade
- Payment history
- Manage subscription
```

---

## UI/UX Changes

### Trainer Dashboard Mockup

```
┌─────────────────────────────────────────────────────────┐
│  🏋️ ZarcoFit for Trainers                    👤 John    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Active Clients: 12/25        📊 Quick Stats             │
│                                                           │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ Workouts │  Meals   │ Progress │ Messages │         │
│  │   124    │   245    │    18    │    42    │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                           │
│  📅 Today's Schedule                                     │
│  ├─ 9:00 AM  - Session with Sarah M.                    │
│  ├─ 11:00 AM - Check-in call with Mike T.               │
│  └─ 3:00 PM  - New client consultation                  │
│                                                           │
│  👥 Clients Needing Attention                           │
│  ├─ Jane D. - No workouts logged this week              │
│  ├─ Bob S. - Progress photos overdue                    │
│  └─ Lisa K. - Low meal adherence                        │
│                                                           │
│  📊 Recent Client Activity                              │
│  ├─ Sarah M. completed "Leg Day" - 2h ago              │
│  ├─ Mike T. logged breakfast - 3h ago                   │
│  └─ Jane D. sent a message - 5h ago                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Client Dashboard (Modified)

```
┌─────────────────────────────────────────────────────────┐
│  🏋️ ZarcoFit                              👤 Sarah       │
│  Your Trainer: Coach John Zarco                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  📋 Today's Workout: Push Day                           │
│  Assigned by Coach John                                  │
│  [Start Workout]                                         │
│                                                           │
│  🍽️ Today's Meals                                       │
│  2,340 / 2,500 calories                                  │
│  [Log Meal]                                              │
│                                                           │
│  💬 Message from Coach John (2h ago)                    │
│  "Great job on yesterday's workout! Let's..."            │
│  [Reply]                                                 │
│                                                           │
│  📈 Your Progress                                        │
│  Weight: 150 lbs → 145 lbs (Goal: 140 lbs)             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Stack Additions

### New Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install @supabase/realtime-js
npm install date-fns-tz
npm install react-big-calendar
npm install recharts (already installed)
npm install react-pdf (for generating reports)
```

---

## API Structure

```
/api
├── /trainer
│   ├── /clients
│   │   ├── GET    /                    # List all clients
│   │   ├── POST   /invite              # Invite new client
│   │   ├── GET    /[clientId]          # Get client details
│   │   ├── GET    /[clientId]/workouts
│   │   ├── GET    /[clientId]/meals
│   │   ├── GET    /[clientId]/progress
│   │   └── POST   /[clientId]/notes
│   ├── /programs
│   │   ├── GET    /                    # List trainer's programs
│   │   ├── POST   /                    # Create program
│   │   └── POST   /assign              # Assign to client
│   └── /messages
│       ├── GET    /                    # All conversations
│       └── POST   /[clientId]          # Send message
│
├── /client
│   ├── /workouts
│   ├── /meals
│   ├── /progress
│   └── /messages
│
└── /webhooks
    └── /stripe                         # Subscription webhooks
```

---

## Success Metrics

### For Trainers
- Client retention rate
- Average clients per trainer
- Engagement rate (client activity)
- Time saved vs manual tracking
- Revenue per trainer

### For Platform
- Monthly recurring revenue (MRR)
- Trainer acquisition cost
- Trainer lifetime value
- Churn rate
- Feature adoption rates

---

## Competitive Advantages to Build In

1. **Seamless Communication**
   - Better than email/text
   - Context-aware (see workout when discussing it)

2. **Smart Insights**
   - AI-powered client risk detection
   - Suggest programs based on client goals
   - Predictive analytics for progress

3. **White Label Option**
   - Trainers can brand as their own app
   - Custom domain
   - Custom colors/logo

4. **Mobile-First**
   - Mobile app for clients
   - Quick workout logging
   - Push notifications

---

## Next Immediate Steps

1. **Create database migration script** with all new tables
2. **Build role selection** into signup flow
3. **Create trainer dashboard** (basic version)
4. **Implement client invitation** system
5. **Update RLS policies** for all existing tables
6. **Build client list** view for trainers
7. **Modify client dashboard** to show assigned programs

---

## Questions to Answer

1. **Can clients have multiple trainers?**
   - Recommendation: Yes, but one "primary" trainer

2. **Can trainers collaborate?**
   - Future feature: Share programs, refer clients

3. **What happens when trainer-client relationship ends?**
   - Client keeps their data
   - Programs become "archived"
   - Messaging disabled

4. **Pricing for clients?**
   - Free for clients (trainer pays)
   - OR freemium (basic free, premium paid)

5. **Data ownership?**
   - Client owns their data
   - Can export anytime
   - Can switch trainers

---

This restructure transforms ZarcoFit into a much more valuable B2B2C platform with recurring revenue potential. The key is building trainer tools that save them time and help them deliver better service to clients.
