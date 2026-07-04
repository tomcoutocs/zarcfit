import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export type TrainerProfile = {
  id: string;
  business_name?: string;
  bio?: string;
  specializations?: string[];
  certifications?: string[];
  years_experience?: number;
  phone?: string;
  website?: string;
  avatar_url?: string;
  is_active: boolean;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'cancelled' | 'past_due';
  max_clients: number;
  created_at?: string;
  updated_at?: string;
};

export type TrainerClient = {
  id: string;
  trainer_id: string;
  client_id: string;
  status: 'pending' | 'active' | 'paused' | 'terminated';
  invited_at: string;
  accepted_at?: string;
  terminated_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type ClientInvitation = {
  id?: string;
  trainer_id: string;
  email: string;
  token?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  first_name?: string;
  last_name?: string;
  personal_message?: string;
  expires_at?: string;
  created_at?: string;
  used_at?: string;
};

// Shape returned by the get_invitation_by_token RPC — a read-only preview
// safe to show before the invitee has signed up or logged in.
export type InvitationPreview = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  personal_message?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  trainer_business_name?: string;
  trainer_first_name?: string;
  trainer_last_name?: string;
};

export type AcceptInvitationResult =
  | 'success'
  | 'not_authenticated'
  | 'not_found'
  | 'already_accepted'
  | 'invalid_status'
  | 'expired'
  | 'email_mismatch'
  | 'error';

export type TrainerSettings = {
  trainer_id: string;
  timezone?: string;
  default_session_duration?: number;
  booking_buffer?: number;
  working_hours?: Record<string, unknown>;
  auto_accept_clients?: boolean;
  notification_preferences?: { email?: boolean; push?: boolean };
  created_at?: string;
  updated_at?: string;
};

export type ClientNote = {
  id?: string;
  trainer_id: string;
  client_id: string;
  note_type: 'general' | 'injury' | 'preference' | 'goal' | 'achievement';
  content: string;
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Conversation = {
  id: string;
  trainer_id: string;
  client_id: string;
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id?: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
};

export type ClientWithProfile = TrainerClient & {
  client_email: string;
  client_name: string;
  client_avatar?: string;
  client_profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
};

type TrainerClientQueryRow = TrainerClient & {
  client?: {
    id: string;
    email?: string;
    user_profiles?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  };
};

export type TrainerWithProfile = TrainerClient & {
  trainer_email: string;
  trainer_name: string;
  trainer_business_name?: string;
};

// Shape returned by the search_potential_clients RPC (see client-search.sql).
export type PotentialClient = {
  client_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  relationship_status: 'pending' | 'active' | 'paused' | 'terminated' | null;
};

export type SendConnectionRequestResult =
  | 'sent'
  | 'already_pending'
  | 'already_active'
  | 'invalid_client'
  | 'not_a_trainer'
  | 'error';

export type RespondToTrainerRequestResult =
  | 'accepted'
  | 'declined'
  | 'not_found'
  | 'invalid_status'
  | 'error';

type ClientTrainerQueryRow = TrainerClient & {
  trainer?: {
    id: string;
    email?: string;
    user_profiles?: {
      first_name?: string;
      last_name?: string;
    };
    trainer_profiles?: {
      business_name?: string;
    };
  };
};

// ============================================
// TRAINER PROFILE API
// ============================================

export const trainerProfileApi = {
  // Get trainer profile
  getProfile: async (trainerId: string): Promise<TrainerProfile | null> => {
    const { data, error } = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('id', trainerId)
      .single();

    if (error) {
      console.error('Error fetching trainer profile:', error);
      return null;
    }

    return data;
  },

  // Update trainer profile
  updateProfile: async (profile: Partial<TrainerProfile> & { id: string }): Promise<TrainerProfile | null> => {
    const { data, error } = await supabase
      .from('trainer_profiles')
      .update({
        business_name: profile.business_name,
        bio: profile.bio,
        specializations: profile.specializations,
        certifications: profile.certifications,
        years_experience: profile.years_experience,
        phone: profile.phone,
        website: profile.website,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating trainer profile:', error);
      return null;
    }

    return data;
  },
};

// ============================================
// TRAINER SETTINGS API
// ============================================

export const trainerSettingsApi = {
  getSettings: async (trainerId: string): Promise<TrainerSettings | null> => {
    const { data, error } = await supabase
      .from('trainer_settings')
      .select('*')
      .eq('trainer_id', trainerId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching trainer settings:', error);
      return null;
    }

    return data;
  },

  // Upsert since a settings row may not exist yet for this trainer.
  updateSettings: async (settings: TrainerSettings): Promise<TrainerSettings | null> => {
    const { data, error } = await supabase
      .from('trainer_settings')
      .upsert(
        { ...settings, updated_at: new Date().toISOString() },
        { onConflict: 'trainer_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating trainer settings:', error);
      return null;
    }

    return data;
  },
};

// ============================================
// CLIENT MANAGEMENT API
// ============================================

export const clientManagementApi = {
  // Get all clients for a trainer
  getClients: async (trainerId: string): Promise<ClientWithProfile[]> => {
    const { data, error } = await supabase
      .from('trainer_clients')
      .select(`
        *,
        client:client_id (
          id,
          email,
          user_profiles (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq('trainer_id', trainerId)
      .in('status', ['active', 'pending'])
      .order('accepted_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    // Transform the data to a flatter structure
    return (data || []).map((item: TrainerClientQueryRow) => ({
      ...item,
      client_email: item.client?.email || '',
      client_name: item.client?.user_profiles?.first_name && item.client?.user_profiles?.last_name
        ? `${item.client.user_profiles.first_name} ${item.client.user_profiles.last_name}`
        : item.client?.email || 'Unknown',
      client_profile: item.client?.user_profiles
    }));
  },

  // Get all trainers for a client (the symmetric counterpart to getClients,
  // used by the client-facing messages page to know who they can chat with)
  getMyTrainers: async (clientId: string): Promise<TrainerWithProfile[]> => {
    const { data, error } = await supabase
      .from('trainer_clients')
      .select(`
        *,
        trainer:trainer_id (
          id,
          email,
          user_profiles (
            first_name,
            last_name
          ),
          trainer_profiles (
            business_name
          )
        )
      `)
      .eq('client_id', clientId)
      .in('status', ['active', 'pending'])
      .order('accepted_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching trainers:', error);
      return [];
    }

    return (data || []).map((item: ClientTrainerQueryRow) => ({
      ...item,
      trainer_email: item.trainer?.email || '',
      trainer_name: item.trainer?.user_profiles?.first_name && item.trainer?.user_profiles?.last_name
        ? `${item.trainer.user_profiles.first_name} ${item.trainer.user_profiles.last_name}`
        : item.trainer?.email || 'Trainer',
      trainer_business_name: item.trainer?.trainer_profiles?.business_name,
    }));
  },

  // Get a specific client relationship
  getClient: async (trainerId: string, clientId: string): Promise<TrainerClient | null> => {
    const { data, error } = await supabase
      .from('trainer_clients')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }

    return data;
  },

  // Update client relationship status
  updateClientStatus: async (
    trainerId: string,
    clientId: string,
    status: 'active' | 'paused' | 'terminated'
  ): Promise<TrainerClient | null> => {
    const update: {
      status: 'active' | 'paused' | 'terminated';
      updated_at: string;
      terminated_at?: string;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'terminated') {
      update.terminated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('trainer_clients')
      .update(update)
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client status:', error);
      return null;
    }

    return data;
  },

  // Update trainer notes about a client
  updateClientNotes: async (
    trainerId: string,
    clientId: string,
    notes: string
  ): Promise<TrainerClient | null> => {
    const { data, error } = await supabase
      .from('trainer_clients')
      .update({
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client notes:', error);
      return null;
    }

    return data;
  },

  // Search for existing client accounts by name/email (see
  // client-search.sql). Used by the "Invite Client" page's "Find Existing
  // Client" tab, as an alternative to sending an email invitation to
  // someone who hasn't signed up yet.
  searchPotentialClients: async (search: string): Promise<PotentialClient[]> => {
    const { data, error } = await supabase.rpc('search_potential_clients', { p_search: search });

    if (error) {
      console.error('Error searching for clients:', error);
      return [];
    }

    return (data as PotentialClient[]) || [];
  },

  // Send a direct connection request to an existing client account. Creates
  // a 'pending' trainer_clients row that the client must accept via
  // respondToTrainerRequest before the trainer gets full access.
  sendConnectionRequest: async (clientId: string): Promise<SendConnectionRequestResult> => {
    const { data, error } = await supabase.rpc('send_client_connection_request', {
      p_client_id: clientId,
    });

    if (error) {
      console.error('Error sending connection request:', error);
      return 'error';
    }

    return (data as SendConnectionRequestResult) || 'error';
  },

  // Accept or decline a pending direct connection request as the client.
  respondToTrainerRequest: async (
    trainerId: string,
    accept: boolean
  ): Promise<RespondToTrainerRequestResult> => {
    const { data, error } = await supabase.rpc('respond_to_trainer_request', {
      p_trainer_id: trainerId,
      p_accept: accept,
    });

    if (error) {
      console.error('Error responding to trainer request:', error);
      return 'error';
    }

    return (data as RespondToTrainerRequestResult) || 'error';
  },
};

// ============================================
// INVITATION API
// ============================================

export const invitationApi = {
  // Create a new client invitation
  createInvitation: async (invitation: Omit<ClientInvitation, 'id' | 'token' | 'created_at'>): Promise<ClientInvitation | null> => {
    const { data, error } = await supabase
      .from('client_invitations')
      .insert([invitation])
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return null;
    }

    return data;
  },

  // Get all invitations for a trainer
  getInvitations: async (trainerId: string): Promise<ClientInvitation[]> => {
    const { data, error } = await supabase
      .from('client_invitations')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }

    return data || [];
  },

  // Get invitation by token. Uses a SECURITY DEFINER RPC (see
  // invitation-flow.sql) because the invited client isn't the trainer and
  // RLS on client_invitations only allows the trainer to SELECT their own
  // rows — a plain table query would be blocked for the invitee.
  getInvitationByToken: async (token: string): Promise<InvitationPreview | null> => {
    const { data, error } = await supabase
      .rpc('get_invitation_by_token', { p_token: token })
      .maybeSingle();

    if (error) {
      console.error('Error fetching invitation:', error);
      return null;
    }

    return data as InvitationPreview | null;
  },

  // Accept an invitation as the currently signed-in user. Delegates to a
  // SECURITY DEFINER RPC that atomically creates the trainer-client
  // relationship and marks the invitation accepted (see invitation-flow.sql).
  acceptInvitation: async (token: string): Promise<AcceptInvitationResult> => {
    const { data, error } = await supabase.rpc('accept_client_invitation', { p_token: token });

    if (error) {
      console.error('Error accepting invitation:', error);
      return 'error';
    }

    return (data as AcceptInvitationResult) || 'error';
  },

  // Cancel an invitation
  cancelInvitation: async (invitationId: string, trainerId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('client_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('trainer_id', trainerId);

    if (error) {
      console.error('Error cancelling invitation:', error);
      return false;
    }

    return true;
  },
};

// ============================================
// CLIENT NOTES API
// ============================================

export const clientNotesApi = {
  // Get all notes for a client
  getNotes: async (trainerId: string, clientId: string): Promise<ClientNote[]> => {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client notes:', error);
      return [];
    }

    return data || [];
  },

  // Create a new note
  createNote: async (note: Omit<ClientNote, 'id' | 'created_at' | 'updated_at'>): Promise<ClientNote | null> => {
    const { data, error } = await supabase
      .from('client_notes')
      .insert([note])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    return data;
  },

  // Update a note
  updateNote: async (noteId: string, content: string): Promise<ClientNote | null> => {
    const { data, error } = await supabase
      .from('client_notes')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return null;
    }

    return data;
  },

  // Toggle pin status
  togglePin: async (noteId: string, isPinned: boolean): Promise<ClientNote | null> => {
    const { data, error } = await supabase
      .from('client_notes')
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling pin:', error);
      return null;
    }

    return data;
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      return false;
    }

    return true;
  },
};

// ============================================
// MESSAGING API
// ============================================

export const messagingApi = {
  // Get or create conversation
  getOrCreateConversation: async (trainerId: string, clientId: string): Promise<Conversation | null> => {
    // Try to get existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .single();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        trainer_id: trainerId,
        client_id: clientId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  },

  // Get all conversations for a trainer
  getTrainerConversations: async (trainerId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  },

  // Get all conversations for a client (symmetric counterpart to
  // getTrainerConversations, used by the client-facing messages page)
  getClientConversations: async (clientId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  },

  // Get messages in a conversation
  getMessages: async (conversationId: string, limit: number = 50): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).reverse(); // Return in chronological order
  },

  // Send a message
  sendMessage: async (message: Omit<Message, 'id' | 'created_at' | 'is_read' | 'read_at'>): Promise<Message | null> => {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }

    return true;
  },
};
