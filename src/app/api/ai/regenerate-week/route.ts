import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientContext } from '@/lib/ai/client-context';
import { logAiUsage } from '@/lib/ai/logger';
import { regenerateWeekRequestSchema, workoutDraftSchema } from '@/lib/ai/schemas';
import {
  regenerateWeekFromRatings,
  validateWorkoutDraft,
  type ExerciseDifficultyRating,
} from '@/lib/ai/workout-generator';

export async function POST(request: Request) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const rl = rateLimit(`ai-regen:${auth.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = regenerateWeekRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { program_id, week_number, client_id } = parsed.data;
  const start = Date.now();

  const ctx = await getClientContext(auth.supabase, auth.user.id, client_id);
  if (!ctx) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const [{ data: sessions }, { data: exercises }] = await Promise.all([
    auth.supabase
      .from('workout_sessions')
      .select('id, name, day_of_week, week_number, notes')
      .eq('program_id', program_id)
      .eq('week_number', week_number),
    auth.supabase.from('exercises').select('id, name, muscle_group, equipment, difficulty'),
  ]);

  if (!sessions?.length) {
    return NextResponse.json({ error: 'No sessions for this week' }, { status: 404 });
  }
  if (!exercises?.length) {
    return NextResponse.json({ error: 'Exercise library unavailable' }, { status: 500 });
  }

  const sessionIds = sessions.map((s) => s.id).filter(Boolean) as string[];
  const { data: workoutExercises } = await auth.supabase
    .from('workout_exercises')
    .select('workout_session_id, exercise_id, sets, reps, rest_seconds, order_index, notes')
    .in('workout_session_id', sessionIds)
    .order('order_index', { ascending: true });

  const currentSessions = sessions.map((session) => ({
    name: session.name,
    day_of_week: session.day_of_week || 1,
    week_number: session.week_number || week_number,
    notes: session.notes,
    exercises: (workoutExercises || [])
      .filter((we) => we.workout_session_id === session.id)
      .map((we) => ({
        exercise_id: we.exercise_id,
        sets: we.sets || 3,
        reps: we.reps || '8-10',
        rest_seconds: we.rest_seconds || 60,
        notes: we.notes,
      })),
  }));

  const exerciseIds = [
    ...new Set(currentSessions.flatMap((s) => s.exercises.map((e) => e.exercise_id))),
  ];

  const { data: clientWorkoutLogs } = await auth.supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', client_id);

  const workoutLogIds = (clientWorkoutLogs || []).map((l) => l.id).filter(Boolean) as string[];

  let logRows: { exercise_id: string; difficulty_rating: number }[] = [];
  if (workoutLogIds.length > 0) {
    const { data } = await auth.supabase
      .from('exercise_logs')
      .select('exercise_id, difficulty_rating')
      .in('workout_log_id', workoutLogIds)
      .in('exercise_id', exerciseIds)
      .not('difficulty_rating', 'is', null);
    logRows = (data || []) as { exercise_id: string; difficulty_rating: number }[];
  }

  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const row of logRows || []) {
    if (!row.exercise_id || row.difficulty_rating == null) continue;
    const prev = ratingAgg.get(row.exercise_id) || { sum: 0, count: 0 };
    ratingAgg.set(row.exercise_id, {
      sum: prev.sum + row.difficulty_rating,
      count: prev.count + 1,
    });
  }

  const ratings: ExerciseDifficultyRating[] = [...ratingAgg.entries()].map(
    ([exercise_id, { sum, count }]) => ({
      exercise_id,
      avg_difficulty: sum / count,
      log_count: count,
    })
  );

  const { sessions: regenerated, adjustments } = regenerateWeekFromRatings({
    sessions: currentSessions,
    exercises,
    ratings,
  });

  const validIds = new Set(exercises.map((e) => e.id).filter(Boolean) as string[]);
  const validation = validateWorkoutDraft({ sessions: regenerated }, validIds);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors }, { status: 422 });
  }

  const draft = workoutDraftSchema.parse({
    sessions: regenerated,
    summary: `Regenerated week ${week_number} from ${ratings.length} exercise rating(s).`,
  });

  logAiUsage({
    endpoint: 'regenerate-week',
    trainerId: auth.user.id,
    clientId: client_id,
    mode: 'rules',
    durationMs: Date.now() - start,
    sessionCount: draft.sessions.length,
  });

  return NextResponse.json({
    draft,
    session_updates: sessions.map((session, index) => ({
      session_id: session.id,
      name: regenerated[index]?.name || session.name,
      exercises: regenerated[index]?.exercises || [],
    })),
    adjustments,
    ratings_used: ratings.length,
    mode: 'rules',
  });
}
