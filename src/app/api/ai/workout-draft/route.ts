import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientContext } from '@/lib/ai/client-context';
import { logAiUsage } from '@/lib/ai/logger';
import { workoutDraftRequestSchema, workoutDraftSchema } from '@/lib/ai/schemas';
import { generateWorkoutDraftRules, validateWorkoutDraft } from '@/lib/ai/workout-generator';

export async function POST(request: Request) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const rl = rateLimit(`ai-workout:${auth.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = workoutDraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const start = Date.now();
  const input = parsed.data;

  if (input.client_id) {
    const ctx = await getClientContext(auth.supabase, auth.user.id, input.client_id);
    if (!ctx) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
  }

  const { data: exercises, error: exError } = await auth.supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment, difficulty');

  if (exError || !exercises?.length) {
    return NextResponse.json({ error: 'Exercise library unavailable' }, { status: 500 });
  }

  const draft = generateWorkoutDraftRules({
    exercises,
    goal: input.goal,
    difficulty: input.difficulty,
    sessionsPerWeek: input.sessions_per_week,
    durationWeeks: input.duration_weeks,
    equipment: input.equipment,
  });

  const validIds = new Set(exercises.map((e) => e.id).filter(Boolean) as string[]);
  const validation = validateWorkoutDraft(draft, validIds);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors }, { status: 422 });
  }

  const safeDraft = workoutDraftSchema.parse(draft);

  logAiUsage({
    endpoint: 'workout-draft',
    trainerId: auth.user.id,
    clientId: input.client_id,
    mode: 'rules',
    durationMs: Date.now() - start,
    sessionCount: safeDraft.sessions.length,
  });

  return NextResponse.json({ draft: safeDraft, mode: 'rules' });
}
