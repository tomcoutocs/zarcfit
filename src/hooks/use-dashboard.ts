import { useState, useEffect, useCallback } from 'react';
import { 
  userProfilesApi, 
  workoutProgramsApi, 
  progressTrackingApi, 
  goalsApi,
  nutritionPlansApi,
  sleepTrackingApi,
  UserProfile,
  WorkoutProgram,
  ProgressRecord,
  Goal,
  NutritionPlan,
  SleepRecord,
} from '@/lib/supabase/dashboard-api';
import { supabase } from '@/lib/supabase';

// Define CalendarEvent type since it's not exported
interface CalendarEvent {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  event_type: 'workout' | 'coaching' | 'nutrition' | 'recovery' | 'milestone';
  has_reminder: boolean;
  is_recurring: boolean;
  created_at?: string;
}

// Add a custom function to get user events
async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId);

  // Handle relation does not exist error
  if (error && (error.message?.includes('relation') || error.message?.includes('does not exist'))) {
    console.warn('Table calendar_events does not exist yet. Please run the schema.sql file in Supabase SQL Editor.');
    return [];
  }

  if (error) {
    console.error('Error fetching user events:', error);
    return [];
  }

  return data || [];
}

interface DashboardData {
  profile: UserProfile | null;
  programs: WorkoutProgram[];
  progress: ProgressRecord | null;
  goals: Goal[];
  nutritionPlans: NutritionPlan[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

export function useDashboard(userId: string | undefined): DashboardData {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    programs: [],
    progress: null,
    goals: [],
    nutritionPlans: [],
    upcomingEvents: [],
    loading: true,
    error: null
  });
  
  // Add session refresh functionality
  const refreshSession = useCallback(async () => {
    try {
      console.log('Attempting to refresh Supabase session...');
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Failed to refresh session:', error);
        return false;
      }
      console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error in refreshSession:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    async function fetchDashboardData(retry = false) {
      if (!userId) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      if (retry) {
        // If retrying, attempt to refresh the session first
        const refreshed = await refreshSession();
        if (!refreshed && retryCount >= MAX_RETRIES) {
          console.error('Max retries reached, giving up');
          return;
        }
      }

      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Fetch all data in parallel for better performance
        const results = await Promise.allSettled([
          userProfilesApi.getProfile(userId),
          workoutProgramsApi.getUserPrograms(userId),
          progressTrackingApi.getLatestProgress(userId),
          goalsApi.getUserGoals(userId),
          nutritionPlansApi.getUserNutritionPlans(userId),
          // Get upcoming events (next 7 days)
          getUserEvents(userId).then((allEvents: CalendarEvent[]) => {
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            
            return allEvents.filter((event: CalendarEvent) => {
              const eventDate = new Date(event.date);
              return eventDate >= now && eventDate <= nextWeek;
            }).sort((a: CalendarEvent, b: CalendarEvent) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );
          })
        ]);

        // Extract results or null for each promise
        const [
          profileResult,
          programsResult,
          progressResult,
          goalsResult,
          nutritionPlansResult,
          eventsResult
        ] = results;

        // Handle individual results
        const userProfile = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const workoutPrograms = programsResult.status === 'fulfilled' ? programsResult.value : [];
        const latestProgress = progressResult.status === 'fulfilled' ? progressResult.value : null;
        const userGoals = goalsResult.status === 'fulfilled' ? goalsResult.value : [];
        const nutritionPlans = nutritionPlansResult.status === 'fulfilled' ? nutritionPlansResult.value : [];
        const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];

        // Track any errors
        const errors = results
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason)
          .map(error => error instanceof Error ? error.message : String(error));

        if (isMounted) {
          setData({
            profile: userProfile,
            programs: workoutPrograms,
            progress: latestProgress,
            goals: userGoals,
            nutritionPlans: nutritionPlans,
            upcomingEvents: events,
            loading: false,
            error: errors.length > 0 ? `Some data failed to load: ${errors.join(', ')}` : null
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        if (isMounted) {
          setData(prev => ({ 
            ...prev, 
            loading: false, 
            error: error instanceof Error ? error.message : 'Failed to load dashboard data' 
          }));
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return data;
}

// Individual hooks for each data type
export function useUserProfile(userId: string | undefined): { profile: UserProfile | null, loading: boolean, error: string | null } {
  const [state, setState] = useState<{ profile: UserProfile | null, loading: boolean, error: string | null }>({
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!userId) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const profile = await userProfilesApi.getProfile(userId);
        
        if (isMounted) {
          setState({ profile, loading: false, error: null });
        }
      } catch (error) {
        console.error('Error in useUserProfile hook:', error);
        
        let errorMessage = 'Failed to load profile';
        
        // Check if it's an empty object error
        if (error && typeof error === 'object' && Object.keys(error).length === 0) {
          errorMessage = 'Authentication error. Please try logging out and back in.';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        if (isMounted) {
          setState({ 
            profile: null, 
            loading: false, 
            error: errorMessage
          });
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return state;
}

export function useWorkoutPrograms(userId: string | undefined): { programs: WorkoutProgram[], loading: boolean, error: string | null } {
  const [state, setState] = useState<{ programs: WorkoutProgram[], loading: boolean, error: string | null }>({
    programs: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchPrograms() {
      if (!userId) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const programs = await workoutProgramsApi.getUserPrograms(userId);
        setState({ programs, loading: false, error: null });
      } catch (error) {
        console.error('Error fetching workout programs:', error);
        setState({ 
          programs: [], 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load programs' 
        });
      }
    }

    fetchPrograms();
  }, [userId]);

  return state;
}

export function useProgress(userId: string | undefined): { progress: ProgressRecord | null, loading: boolean, error: string | null } {
  const [state, setState] = useState<{ progress: ProgressRecord | null, loading: boolean, error: string | null }>({
    progress: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchProgress() {
      if (!userId) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const progress = await progressTrackingApi.getLatestProgress(userId);
        setState({ progress, loading: false, error: null });
      } catch (error) {
        console.error('Error fetching progress:', error);
        setState({ 
          progress: null, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load progress' 
        });
      }
    }

    fetchProgress();
  }, [userId]);

  return state;
}

export function useGoals(userId: string | undefined): { goals: Goal[], loading: boolean, error: string | null } {
  const [state, setState] = useState<{ goals: Goal[], loading: boolean, error: string | null }>({
    goals: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchGoals() {
      if (!userId) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const goals = await goalsApi.getUserGoals(userId);
        setState({ goals, loading: false, error: null });
      } catch (error) {
        console.error('Error fetching goals:', error);
        setState({ 
          goals: [], 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load goals' 
        });
      }
    }

    fetchGoals();
  }, [userId]);

  return state;
}

export function useSleepRecords(userId: string | undefined) {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [latestRecord, setLatestRecord] = useState<SleepRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSleepRecords = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const records = await sleepTrackingApi.getUserSleepRecords(userId);
      
      // Sort records by date in descending order (newest first)
      const sortedRecords = [...records].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setSleepRecords(sortedRecords);
      setLatestRecord(sortedRecords.length > 0 ? sortedRecords[0] : null);
    } catch (error) {
      console.error('Error fetching sleep records:', error);
      setError('Failed to load sleep records. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSleepRecords();
  }, [fetchSleepRecords]);

  return {
    sleepRecords,
    latestRecord,
    loading,
    error,
    refetch: fetchSleepRecords
  };
}

// Function to get sleep records within a date range
export function useSleepRecordsInRange(userId: string | undefined, startDate: string, endDate: string): {
  sleepRecords: SleepRecord[],
  loading: boolean,
  error: string | null,
  refetch: () => void
} {
  const [state, setState] = useState<{
    sleepRecords: SleepRecord[],
    loading: boolean,
    error: string | null
  }>({
    sleepRecords: [],
    loading: true,
    error: null
  });

  const fetchData = async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const records = await sleepTrackingApi.getSleepRecordsInRange(userId, startDate, endDate);
      
      setState({
        sleepRecords: records,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching sleep records in range:', error);
      setState({
        sleepRecords: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load sleep records for the date range'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, startDate, endDate]);

  return {
    ...state,
    refetch: fetchData
  };
} 