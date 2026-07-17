import type { SupabaseClient } from '@supabase/supabase-js';

export type ClientContext = {
  clientId: string;
  notes: { note_type: string; content: string; is_pinned: boolean }[];
  goals: { title: string; category: string; target_value?: number; current_value?: number }[];
  recentWorkouts: number;
  avgDifficulty?: number;
  diaryAdherence?: number;
};

export async function getClientContext(
  supabase: SupabaseClient,
  trainerId: string,
  clientId: string
): Promise<ClientContext | null> {
  const { data: link } = await supabase
    .from('trainer_clients')
    .select('id')
    .eq('trainer_id', trainerId)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle();

  if (!link) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const [notesRes, goalsRes, logsRes, diaryRes] = await Promise.all([
    supabase
      .from('client_notes')
      .select('note_type, content, is_pinned')
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId)
      .order('is_pinned', { ascending: false })
      .limit(10),
    supabase
      .from('goals')
      .select('title, category, target_value, current_value')
      .eq('user_id', clientId)
      .eq('is_completed', false)
      .limit(5),
    supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', clientId)
      .gte('date', weekAgoStr),
    supabase
      .from('food_diary_entries')
      .select('logged_date')
      .eq('user_id', clientId)
      .gte('logged_date', weekAgoStr),
  ]);

  const diaryDays = new Set((diaryRes.data || []).map((d) => d.logged_date)).size;

  return {
    clientId,
    notes: notesRes.data || [],
    goals: goalsRes.data || [],
    recentWorkouts: logsRes.data?.length || 0,
    diaryAdherence: Math.round((diaryDays / 7) * 100),
  };
}
