import { supabase } from '../supabase';

export type SessionRequest = {
  id?: string;
  client_id: string;
  trainer_id: string;
  requested_date: string;
  start_time: string;
  end_time: string;
  message?: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  calendar_event_id?: string;
  trainer_response?: string;
  created_at?: string;
  updated_at?: string;
  trainer_name?: string;
  client_name?: string;
};

export const sessionRequestsApi = {
  createRequest: async (request: Omit<SessionRequest, 'id' | 'status'>): Promise<SessionRequest | null> => {
    const { data, error } = await supabase
      .from('session_requests')
      .insert([{ ...request, status: 'pending' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating session request:', error);
      return null;
    }
    return data;
  },

  getClientRequests: async (clientId: string): Promise<SessionRequest[]> => {
    const { data, error } = await supabase
      .from('session_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client session requests:', error);
      return [];
    }
    return data || [];
  },

  getTrainerPendingRequests: async (trainerId: string): Promise<SessionRequest[]> => {
    const { data, error } = await supabase
      .from('session_requests')
      .select(`
        *,
        client:client_id (
          email,
          user_profiles ( first_name, last_name )
        )
      `)
      .eq('trainer_id', trainerId)
      .eq('status', 'pending')
      .order('requested_date', { ascending: true });

    if (error) {
      console.error('Error fetching trainer session requests:', error);
      return [];
    }

    return (data || []).map((row: SessionRequest & {
      client?: { email?: string; user_profiles?: { first_name?: string; last_name?: string } };
    }) => ({
      ...row,
      client_name: row.client?.user_profiles?.first_name && row.client?.user_profiles?.last_name
        ? `${row.client.user_profiles.first_name} ${row.client.user_profiles.last_name}`
        : row.client?.email || 'Client',
    }));
  },

  cancelRequest: async (requestId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('session_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling session request:', error);
      return false;
    }
    return true;
  },

  respondToRequest: async (
    requestId: string,
    action: 'approve' | 'decline',
    response?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.rpc('respond_to_session_request', {
      p_request_id: requestId,
      p_action: action,
      p_response: response || null,
    });

    if (error) {
      console.error('Error responding to session request:', error);
      return { success: false, error: error.message };
    }
    return { success: true, ...((data as object) || {}) };
  },
};
