import { useState, useEffect, useCallback } from 'react';
import { calendarApi, CalendarEvent } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentMonth: number;
  currentYear: number;
}

interface CalendarActions {
  createEvent: (event: Omit<CalendarEvent, 'user_id'>) => Promise<CalendarEvent | null>;
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  setMonth: (month: number, year: number) => void;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  goToToday: () => void;
}

export const useCalendar = (): [CalendarState, CalendarActions] => {
  const today = new Date();
  const { user } = useAuth();
  
  const [state, setState] = useState<CalendarState>({
    events: [],
    loading: true,
    error: null,
    currentMonth: today.getMonth() + 1, // 1-12
    currentYear: today.getFullYear(),
  });

  const fetchEvents = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, events: [], loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const events = await calendarApi.getMonthEvents(
        user.id,
        state.currentYear,
        state.currentMonth
      );

      setState(prev => ({ ...prev, events, loading: false }));
    } catch (error: unknown) {
      console.error('Error fetching month events:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to fetch events';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [user?.id, state.currentYear, state.currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const actions: CalendarActions = {
    createEvent: async (eventData) => {
      if (!user?.id) return null;

      const newEvent: CalendarEvent = {
        ...eventData,
        user_id: user.id,
      };

      const createdEvent = await calendarApi.createEvent(newEvent);
      
      if (createdEvent) {
        setState(prev => ({
          ...prev,
          events: [...prev.events, createdEvent]
        }));
      }

      return createdEvent;
    },

    updateEvent: async (event) => {
      const updatedEvent = await calendarApi.updateEvent(event);
      
      if (updatedEvent) {
        setState(prev => ({
          ...prev,
          events: prev.events.map(e => e.id === updatedEvent.id ? updatedEvent : e)
        }));
      }

      return updatedEvent;
    },

    deleteEvent: async (eventId) => {
      const success = await calendarApi.deleteEvent(eventId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          events: prev.events.filter(e => e.id !== eventId)
        }));
      }

      return success;
    },

    setMonth: (month, year) => {
      setState(prev => ({ ...prev, currentMonth: month, currentYear: year }));
    },

    goToNextMonth: () => {
      setState(prev => {
        let newMonth = prev.currentMonth + 1;
        let newYear = prev.currentYear;
        
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
        
        return { ...prev, currentMonth: newMonth, currentYear: newYear };
      });
    },

    goToPreviousMonth: () => {
      setState(prev => {
        let newMonth = prev.currentMonth - 1;
        let newYear = prev.currentYear;
        
        if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }
        
        return { ...prev, currentMonth: newMonth, currentYear: newYear };
      });
    },

    goToToday: () => {
      const now = new Date();
      setState(prev => ({
        ...prev,
        currentMonth: now.getMonth() + 1,
        currentYear: now.getFullYear()
      }));
    }
  };

  return [state, actions];
}; 