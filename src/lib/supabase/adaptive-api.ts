import { supabase } from '@/lib/supabase';
import type { ExerciseRatingAggregate } from '@/lib/ai/adaptive-suggestions';

export type { ExerciseRatingAggregate } from '@/lib/ai/adaptive-suggestions';

/** One flagged client+exercise pair returned by the trainer-wide digest (CA-602). */
export type DifficultyDigestItem = {
  client_id: string;
  client_name: string;
  exercise_id: string;
  exercise_name: string;
  avg_difficulty: number;
  log_count: number;
  hard_count: number;
  easy_count: number;
  last_rated_at: string;
};

type ExerciseLogRatingRow = {
  exercise_id: string | null;
  difficulty_rating: number | null;
  exercises: { name: string; muscle_group: string | null } | { name: string; muscle_group: string | null }[] | null;
};

function firstExercise(
  value: ExerciseLogRatingRow['exercises']
): { name: string; muscle_group: string | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

export const adaptiveApi = {
  /**
   * Per-exercise difficulty aggregate for a single client, powering the
   * "Adaptive Programming" card on the client Overview (CA-601) and the
   * swap suggestions in CA-603. Mirrors the rating aggregation used by the
   * /api/ai/regenerate-week route, but exposes hard/easy counts too.
   */
  getClientDifficultySummary: async (clientId: string): Promise<ExerciseRatingAggregate[]> => {
    const { data: logs, error: logsError } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', clientId);

    if (logsError || !logs?.length) return [];

    const workoutLogIds = logs.map((l) => l.id).filter(Boolean) as string[];
    if (workoutLogIds.length === 0) return [];

    const { data: rows, error } = await supabase
      .from('exercise_logs')
      .select('exercise_id, difficulty_rating, exercises(name, muscle_group)')
      .in('workout_log_id', workoutLogIds)
      .not('difficulty_rating', 'is', null);

    if (error) {
      console.error('Error fetching client difficulty ratings:', error);
      return [];
    }

    const agg = new Map<string, ExerciseRatingAggregate>();
    for (const row of (rows || []) as ExerciseLogRatingRow[]) {
      if (!row.exercise_id || row.difficulty_rating == null) continue;
      const exerciseInfo = firstExercise(row.exercises);
      const existing = agg.get(row.exercise_id) || {
        exercise_id: row.exercise_id,
        exercise_name: exerciseInfo?.name || 'Unknown exercise',
        muscle_group: exerciseInfo?.muscle_group || undefined,
        avg_difficulty: 0,
        log_count: 0,
        hard_count: 0,
        easy_count: 0,
      };

      const priorSum = existing.avg_difficulty * existing.log_count;
      existing.log_count += 1;
      existing.avg_difficulty = (priorSum + row.difficulty_rating) / existing.log_count;
      if (row.difficulty_rating >= 4) existing.hard_count += 1;
      if (row.difficulty_rating <= 2) existing.easy_count += 1;

      agg.set(row.exercise_id, existing);
    }

    return Array.from(agg.values()).sort(
      (a, b) => b.hard_count - a.hard_count || b.easy_count - a.easy_count || b.log_count - a.log_count
    );
  },

  /**
   * Trainer-wide digest of exercises rated too hard/easy recently, across
   * every active client (CA-602). Backed by the `get_trainer_difficulty_digest`
   * SQL function so aggregation happens in the database, not the client.
   */
  getTrainerDifficultyDigest: async (days = 7): Promise<DifficultyDigestItem[]> => {
    const { data, error } = await supabase.rpc('get_trainer_difficulty_digest', { p_days: days });

    if (error) {
      console.error('Error fetching trainer difficulty digest:', error);
      return [];
    }

    return (data as DifficultyDigestItem[]) || [];
  },
};
