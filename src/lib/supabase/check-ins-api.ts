import { supabase } from '@/lib/supabase';

export type ClientCheckIn = {
  id?: string;
  client_id: string;
  check_in_date: string;
  mood: number;
  energy: number;
  sleep_quality: number;
  weight_kg?: number;
  notes?: string;
  created_at?: string;
};

export type MissedCheckIn = {
  client_id: string;
  client_name: string;
  client_email: string;
  last_check_in_date: string | null;
};

export type CheckInDigestResult = {
  sent: boolean;
  reason?: string;
  skipped?: boolean;
  error?: string;
  clients: MissedCheckIn[];
};

/** Days between today and a `YYYY-MM-DD` check-in date, or null if there's no date. */
export function daysSinceCheckIn(checkInDate?: string | null): number | null {
  if (!checkInDate) return null;
  const then = new Date(`${checkInDate}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  const diffMs = new Date().setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** True if the client is due for a check-in — none logged, or the last one is stale. */
export function needsCheckIn(latest: ClientCheckIn | null, thresholdDays = 7): boolean {
  if (!latest) return true;
  const days = daysSinceCheckIn(latest.check_in_date);
  return days === null || days >= thresholdDays;
}

export const checkInsApi = {
  // Used by both the client's own check-in history and the trainer's
  // client-detail view — RLS on `client_check_ins` grants trainers read
  // access to their active clients' check-ins.
  getCheckIns: async (clientId: string, limit = 10): Promise<ClientCheckIn[]> => {
    const { data, error } = await supabase
      .from('client_check_ins')
      .select('*')
      .eq('client_id', clientId)
      .order('check_in_date', { ascending: false })
      .limit(limit);

    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table client_check_ins does not exist yet. Please run client-check-ins.sql in Supabase SQL Editor.');
      return [];
    }

    if (error) {
      console.error('Error fetching check-ins:', error);
      return [];
    }

    return data || [];
  },

  getLatestCheckIn: async (clientId: string): Promise<ClientCheckIn | null> => {
    const { data, error } = await supabase
      .from('client_check_ins')
      .select('*')
      .eq('client_id', clientId)
      .order('check_in_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.warn('Table client_check_ins does not exist yet. Please run client-check-ins.sql in Supabase SQL Editor.');
      return null;
    }

    if (error) {
      console.error('Error fetching latest check-in:', error);
      return null;
    }

    return data;
  },

  getTodaysCheckIn: async (clientId: string): Promise<ClientCheckIn | null> => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('client_check_ins')
      .select('*')
      .eq('client_id', clientId)
      .eq('check_in_date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today\'s check-in:', error);
      return null;
    }

    return data;
  },

  // Upsert on (client_id, check_in_date) so re-submitting the same day
  // updates the existing row instead of hitting the unique constraint.
  createCheckIn: async (checkIn: Omit<ClientCheckIn, 'id' | 'created_at'>): Promise<ClientCheckIn | null> => {
    const { data, error } = await supabase
      .from('client_check_ins')
      .upsert([checkIn], { onConflict: 'client_id,check_in_date' })
      .select()
      .single();

    if (error) {
      console.error('Error saving check-in:', error);
      return null;
    }

    return data;
  },

  getMissedCheckIns: async (days = 7): Promise<MissedCheckIn[]> => {
    const { data, error } = await supabase.rpc('get_missed_check_ins', { p_days: days });

    if (error) {
      console.error('Error fetching missed check-ins:', error);
      return [];
    }

    return (data as MissedCheckIn[]) || [];
  },

  sendMissedDigest: async (): Promise<CheckInDigestResult | null> => {
    try {
      const res = await fetch('/api/trainer/check-in-digest', { method: 'POST' });
      const data = await res.json();
      return data as CheckInDigestResult;
    } catch (error) {
      console.error('Error sending check-in digest:', error);
      return null;
    }
  },
};
