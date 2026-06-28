import { createSupabaseBrowserClient } from './supabase/browser';

/** Shared browser client — uses cookie-based auth (same session as AuthProvider). */
export const supabase = createSupabaseBrowserClient();

export type CalendarEvent = {
  id?: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  event_type: 'workout' | 'coaching' | 'nutrition' | 'recovery' | 'milestone';
  has_reminder: boolean;
  is_recurring: boolean;
  user_id: string;
  created_at?: string;
};

export const calendarApi = {
  getUserEvents: async (userId: string): Promise<CalendarEvent[]> => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching events:', error.message ?? error);
      return [];
    }

    return data || [];
  },

  getMonthEvents: async (userId: string, year: number, month: number): Promise<CalendarEvent[]> => {
    if (!userId) {
      console.error('getMonthEvents: No userId provided');
      return [];
    }

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Error fetching month events:', error.message ?? error);
      throw new Error(error.message);
    }

    return data || [];
  },

  createEvent: async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([event])
      .select();

    if (error) {
      console.error('Error creating event:', error.message ?? error);
      return null;
    }

    return data?.[0] || null;
  },

  updateEvent: async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    const { id, ...eventData } = event;

    const { data, error } = await supabase
      .from('calendar_events')
      .update(eventData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating event:', error.message ?? error);
      return null;
    }

    return data?.[0] || null;
  },

  deleteEvent: async (eventId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error.message ?? error);
      return false;
    }

    return true;
  },
};
