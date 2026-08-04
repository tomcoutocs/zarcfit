import { supabase } from '@/lib/supabase';
import { resolveClientLimit } from '@/lib/trainer-plans';

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
  // 'basic'/'enterprise' are legacy values from the original schema — the
  // Stripe checkout/webhook flow and TRAINER_PLANS only ever write/read
  // 'free' | 'starter' | 'growth' | 'pro' (see retier-subscription.sql).
  subscription_tier: 'free' | 'starter' | 'growth' | 'pro' | 'basic' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'cancelled' | 'past_due';
  max_clients: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_connect_account_id?: string;
  stripe_connect_onboarded?: boolean;
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

export function buildInvitationUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/auth/accept-invitation?token=${encodeURIComponent(token)}`;
}

export function getInvitationDisplayStatus(
  invitation: Pick<ClientInvitation, 'status' | 'expires_at'>
): ClientInvitation['status'] {
  if (invitation.status !== 'pending') return invitation.status;
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return 'expired';
  }
  return 'pending';
}

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
  | 'is_trainer'
  | 'error';

export type CreateInvitationResult =
  | { status: 'success'; invitation: ClientInvitation }
  | { status: 'is_trainer' }
  | { status: 'invalid_email' }
  | { status: 'not_a_trainer' }
  | { status: 'not_authenticated' }
  | { status: 'limit_reached'; limit: number; usage: number }
  | { status: 'error' };

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
  attachment_url?: string;
  message_type?: string;
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

export type TrainerWithProfile = TrainerClient & {
  trainer_email: string;
  trainer_name: string;
  trainer_business_name?: string;
  trainer_avatar_url?: string;
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
  // Get all clients for a trainer (via RPC — cannot embed auth.users in browser queries)
  getClients: async (trainerId: string): Promise<ClientWithProfile[]> => {
    const { data, error } = await supabase.rpc('get_trainer_clients', {
      trainer_uuid: trainerId,
    });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    type TrainerClientRow = {
      relationship_id: string;
      trainer_id: string;
      client_id: string;
      status: TrainerClient['status'];
      invited_at: string;
      accepted_at?: string;
      terminated_at?: string;
      notes?: string;
      client_email: string;
      client_name: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };

    return ((data as TrainerClientRow[]) || []).map((row) => ({
      id: row.relationship_id,
      trainer_id: row.trainer_id,
      client_id: row.client_id,
      status: row.status,
      invited_at: row.invited_at,
      accepted_at: row.accepted_at,
      terminated_at: row.terminated_at,
      notes: row.notes,
      client_email: row.client_email,
      client_name: row.client_name,
      client_profile: {
        first_name: row.first_name,
        last_name: row.last_name,
        avatar_url: row.avatar_url,
      },
    }));
  },

  // Get all trainers for a client (via RPC — cannot embed auth.users in browser queries)
  getMyTrainers: async (clientId: string): Promise<TrainerWithProfile[]> => {
    const { data, error } = await supabase.rpc('get_client_trainers', {
      client_uuid: clientId,
    });

    if (error) {
      console.error('Error fetching trainers:', error);
      return [];
    }

    type ClientTrainerRow = {
      relationship_id: string;
      trainer_id: string;
      client_id: string;
      status: TrainerClient['status'];
      invited_at: string;
      accepted_at?: string;
      terminated_at?: string;
      notes?: string;
      trainer_email: string;
      trainer_name: string;
      trainer_business_name?: string;
      trainer_avatar_url?: string;
    };

    return ((data as ClientTrainerRow[]) || []).map((row) => ({
      id: row.relationship_id,
      trainer_id: row.trainer_id,
      client_id: row.client_id,
      status: row.status,
      invited_at: row.invited_at,
      accepted_at: row.accepted_at,
      terminated_at: row.terminated_at,
      notes: row.notes,
      trainer_email: row.trainer_email,
      trainer_name: row.trainer_name,
      trainer_business_name: row.trainer_business_name,
      trainer_avatar_url: row.trainer_avatar_url,
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
};

// ============================================
// INVITATION API
// ============================================

export const invitationApi = {
  // Create a new client invitation (RPC blocks trainer account emails)
  createInvitation: async (
    invitation: Omit<ClientInvitation, 'id' | 'token' | 'created_at'>
  ): Promise<CreateInvitationResult> => {
    const { data, error } = await supabase.rpc('create_client_invitation', {
      p_email: invitation.email,
      p_first_name: invitation.first_name ?? null,
      p_last_name: invitation.last_name ?? null,
      p_personal_message: invitation.personal_message ?? null,
      p_expires_at: invitation.expires_at,
    });

    if (error) {
      console.error('Error creating invitation:', error);
      return { status: 'error' };
    }

    const result = data as { status?: string; invitation?: ClientInvitation } | null;
    if (!result?.status) {
      return { status: 'error' };
    }

    if (result.status === 'success' && result.invitation) {
      return { status: 'success', invitation: result.invitation };
    }

    if (result.status === 'limit_reached') {
      const limited = data as { limit?: number; usage?: number };
      return { status: 'limit_reached', limit: Number(limited.limit ?? 0), usage: Number(limited.usage ?? 0) };
    }

    if (
      result.status === 'is_trainer' ||
      result.status === 'invalid_email' ||
      result.status === 'not_a_trainer' ||
      result.status === 'not_authenticated'
    ) {
      return { status: result.status };
    }

    return { status: 'error' };
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
// BILLING / USAGE API (PF-312, PF-313)
// ============================================

export type ClientUsage = {
  /** Roster clients with status = 'active'. Drives the "X of Y clients" meter. */
  activeCount: number;
  /** Roster clients with status = 'paused' — still count against the cap. */
  pausedCount: number;
  /** Pending, non-expired invitations — would become clients on acceptance. */
  pendingInvitationCount: number;
  /** Effective seat count against the limit: active + paused + pending invites. */
  usageForLimit: number;
  limit: number;
  tier: string;
  atCap: boolean;
};

export const billingApi = {
  getClientUsage: async (trainerId: string): Promise<ClientUsage> => {
    const [profileRes, clientsRes, invitesRes] = await Promise.all([
      supabase
        .from('trainer_profiles')
        .select('max_clients, subscription_tier')
        .eq('id', trainerId)
        .single(),
      supabase.from('trainer_clients').select('status').eq('trainer_id', trainerId).in('status', ['active', 'paused']),
      supabase.from('client_invitations').select('expires_at').eq('trainer_id', trainerId).eq('status', 'pending'),
    ]);

    const clientRows = (clientsRes.data as { status: string }[] | null) || [];
    const activeCount = clientRows.filter((row) => row.status === 'active').length;
    const pausedCount = clientRows.filter((row) => row.status === 'paused').length;

    const now = Date.now();
    const inviteRows = (invitesRes.data as { expires_at: string | null }[] | null) || [];
    const pendingInvitationCount = inviteRows.filter(
      (row) => !row.expires_at || new Date(row.expires_at).getTime() > now
    ).length;

    const tier = (profileRes.data?.subscription_tier as string | undefined) || 'free';
    const limit = resolveClientLimit({
      max_clients: profileRes.data?.max_clients as number | null | undefined,
      subscription_tier: tier,
    });
    const usageForLimit = activeCount + pausedCount + pendingInvitationCount;

    return {
      activeCount,
      pausedCount,
      pendingInvitationCount,
      usageForLimit,
      limit,
      tier,
      atCap: usageForLimit >= limit,
    };
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
// CONNECT INVOICES + RECURRING SUBSCRIPTIONS (CA-401–404)
// ============================================

export type TrainerClientInvoice = {
  id: string;
  trainer_id: string;
  client_id: string | null;
  stripe_invoice_id: string;
  stripe_account_id: string;
  amount_cents: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' | 'payment_failed';
  description?: string | null;
  hosted_invoice_url?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceBillingStatus = 'paid' | 'overdue' | 'unpaid' | 'none';

/** Roster/detail badge status from a client's most recent invoice (CA-402). */
export function resolveInvoiceBillingStatus(
  invoice: TrainerClientInvoice | null | undefined
): InvoiceBillingStatus {
  if (!invoice) return 'none';
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'void' || invoice.status === 'uncollectible') return 'none';

  const isPastDue = invoice.due_date ? new Date(invoice.due_date) < new Date() : false;
  if (isPastDue) return 'overdue';

  // 'draft', 'open', 'payment_failed' with no due date (or not yet due) yet.
  return 'unpaid';
}

/** Picks the most recently created invoice per client_id. */
export function latestInvoiceByClient(
  invoices: TrainerClientInvoice[]
): Map<string, TrainerClientInvoice> {
  const latest = new Map<string, TrainerClientInvoice>();
  for (const invoice of invoices) {
    if (!invoice.client_id) continue;
    const current = latest.get(invoice.client_id);
    if (!current || new Date(invoice.created_at || 0) > new Date(current.created_at || 0)) {
      latest.set(invoice.client_id, invoice);
    }
  }
  return latest;
}

export const invoicesApi = {
  getInvoicesForTrainer: async (trainerId: string): Promise<TrainerClientInvoice[]> => {
    const { data, error } = await supabase
      .from('trainer_client_invoices')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return data || [];
  },

  getInvoicesForClient: async (trainerId: string, clientId: string): Promise<TrainerClientInvoice[]> => {
    const { data, error } = await supabase
      .from('trainer_client_invoices')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client invoices:', error);
      return [];
    }

    return data || [];
  },

  resendInvoice: async (invoiceId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/stripe/connect/invoices/${invoiceId}/resend`, { method: 'POST' });
      return res.ok;
    } catch (error) {
      console.error('Error resending invoice:', error);
      return false;
    }
  },

  voidInvoice: async (invoiceId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/stripe/connect/invoices/${invoiceId}/void`, { method: 'POST' });
      return res.ok;
    } catch (error) {
      console.error('Error voiding invoice:', error);
      return false;
    }
  },
};

export type TrainerClientSubscription = {
  id: string;
  trainer_id: string;
  client_id: string | null;
  stripe_account_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id?: string | null;
  amount_cents: number;
  currency: string;
  interval: 'month' | 'year';
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const subscriptionsApi = {
  getSubscriptionsForClient: async (
    trainerId: string,
    clientId: string
  ): Promise<TrainerClientSubscription[]> => {
    const { data, error } = await supabase
      .from('trainer_client_subscriptions')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client subscriptions:', error);
      return [];
    }

    return data || [];
  },

  createSubscription: async (input: {
    clientId: string;
    clientEmail: string;
    clientName: string;
    amountCents: number;
    interval: 'month' | 'year';
    description?: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const res = await fetch('/api/stripe/connect/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Failed to create subscription' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Failed to create subscription' };
    }
  },

  cancelSubscription: async (subscriptionId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/stripe/connect/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
      });
      return res.ok;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  },
};

// ============================================
// MESSAGING API
// ============================================

export const messagingApi = {
  // Get or create a trainer-client conversation (RPC enforces roster rules)
  getOrCreateConversation: async (trainerId: string, clientId: string): Promise<Conversation | null> => {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_trainer_id: trainerId,
      p_client_id: clientId,
    });

    if (error) {
      console.error('Error getting or creating conversation:', error);
      return null;
    }

    const result = data as { status?: string; conversation?: Conversation } | null;
    if (result?.status === 'success' && result.conversation) {
      return result.conversation;
    }

    console.error('Could not open conversation:', result?.status || 'unknown');
    return null;
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

    // CA-203: best-effort web push to the other party. Never blocks or
    // fails the send if this errors out or push isn't configured.
    if (data?.id && typeof fetch !== 'undefined') {
      fetch('/api/push/notify-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: data.conversation_id, messageId: data.id }),
      }).catch(() => {});
    }

    return data;
  },

  searchMessages: async (conversationId: string, query: string): Promise<Message[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .ilike('content', `%${trimmed}%`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error searching messages:', error);
      return [];
    }

    return data || [];
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

// ============================================
// TRAINER DASHBOARD API
// ============================================

export type TrainerDashboardStats = {
  workouts_this_week: number;
  unread_messages: number;
  sessions_today: number;
};

export type ClientActivityItem = {
  activity_type: 'workout' | 'progress' | 'goal' | 'message' | 'sleep' | 'check_in';
  client_id: string;
  client_name: string;
  summary: string;
  occurred_at: string;
  reference_id: string;
};

export type UserNotification = {
  id: string;
  type:
    | 'workout_assigned'
    | 'meal_plan'
    | 'message'
    | 'workout_logged'
    | 'progress_logged'
    | 'goal_updated'
    | 'sleep_logged'
    | 'check_in_logged';
  title: string;
  body: string;
  link_path?: string | null;
  actor_id?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export const notificationsApi = {
  getNotifications: async (limit = 20): Promise<UserNotification[]> => {
    const { data, error } = await supabase.rpc('get_user_notifications', { p_limit: limit });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data as UserNotification[]) || [];
  },

  getUnreadCount: async (): Promise<number> => {
    const { data, error } = await supabase.rpc('get_unread_notification_count');

    if (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }

    return Number(data ?? 0);
  },

  markRead: async (notificationId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) {
      console.error('Error marking notification read:', error);
      return false;
    }

    return Boolean(data);
  },

  markAllRead: async (): Promise<number> => {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      console.error('Error marking all notifications read:', error);
      return 0;
    }

    return Number(data ?? 0);
  },
};

export const trainerDashboardApi = {
  getStats: async (): Promise<TrainerDashboardStats | null> => {
    const { data, error } = await supabase.rpc('get_trainer_dashboard_stats').maybeSingle();

    if (error) {
      console.error('Error fetching trainer dashboard stats:', error);
      return null;
    }

    return data as TrainerDashboardStats | null;
  },

  getClientActivity: async (limit = 20): Promise<ClientActivityItem[]> => {
    const { data, error } = await supabase.rpc('get_trainer_client_activity', { p_limit: limit });

    if (error) {
      console.error('Error fetching trainer client activity:', error);
      return [];
    }

    return (data as ClientActivityItem[]) || [];
  },
};
