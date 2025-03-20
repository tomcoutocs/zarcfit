import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hwjpvqekhjlpmvqyjwzl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3anB2cWVraGpscG12cXlqd3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5Nzk3MDQsImV4cCI6MjA1NzU1NTcwNH0.9wvZCNNugjsHQu3ycMNK1q1h8pFytXSVTxSt5PtFDAg';

// Validate that the Supabase URL and API key are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Event type definitions for type safety
export type CalendarEvent = {
  id?: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  start_time?: string; // ISO date string
  end_time?: string; // ISO date string
  is_all_day: boolean;
  event_type: 'workout' | 'coaching' | 'nutrition' | 'recovery' | 'milestone';
  has_reminder: boolean;
  is_recurring: boolean;
  user_id: string;
  created_at?: string;
};

// API functions for calendar events
export const calendarApi = {
  // Get all events for a specific user
  getUserEvents: async (userId: string): Promise<CalendarEvent[]> => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return data || [];
  },

  // Get events for a specific month
  getMonthEvents: async (userId: string, year: number, month: number): Promise<CalendarEvent[]> => {
    if (!userId) {
      console.error('getMonthEvents: No userId provided');
      return [];
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching month events:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getMonthEvents:', error);
      throw error; // Re-throw to let the hook handle the error
    }
  },

  // Create a new event
  createEvent: async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([event])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Update an existing event
  updateEvent: async (event: CalendarEvent): Promise<CalendarEvent | null> => {
    const { id, ...eventData } = event;

    const { data, error } = await supabase
      .from('calendar_events')
      .update(eventData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Delete an event
  deleteEvent: async (eventId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  }
}; 