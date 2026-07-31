import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientContext } from '@/lib/ai/client-context';
import { logAiUsage } from '@/lib/ai/logger';
import { generateWorkoutDraftLlm, isLlmAvailable } from '@/lib/ai/llm-client';
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
  let clientContext = null;

  if (input.client_id) {
    clientContext = await getClientContext(auth.supabase, auth.user.id, input.client_id);
    if (!clientContext) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
  }

  const { data: exercises, error: exError } = await auth.supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment, difficulty');

  if (exError || !exercises?.length) {
    return NextResponse.json({ error: 'Exercise library unavailable' }, { status: 500 });
  }

  const validIds = new Set(exercises.map((e) => e.id).filter(Boolean) as string[]);
  let mode: 'rules' | 'llm' = 'rules';
  let draft = generateWorkoutDraftRules({
    exercises,
    goal: input.goal,
    difficulty: input.difficulty,
    sessionsPerWeek: input.sessions_per_week,
    durationWeeks: input.duration_weeks,
    equipment: input.equipment,
  });

  const wantLlm = input.use_ai !== false && isLlmAvailable();
  if (wantLlm) {
    const notes = clientContext?.notes.map((n) => n.content).join('; ');
    const llmResult = await generateWorkoutDraftLlm({
      goal: input.goal,
      difficulty: input.difficulty,
      sessionsPerWeek: input.sessions_per_week,
      durationWeeks: input.duration_weeks,
      equipment: input.equipment,
      exerciseCatalog: exercises.map((e) => ({
        id: e.id!,
        name: e.name,
        muscle_group: e.muscle_group,
        equipment: e.equipment,
      })),
      clientNotes: notes,
    });

    if (llmResult.ok) {
      const validation = validateWorkoutDraft(llmResult.data, validIds);
      if (validation.valid) {
        try {
          draft = workoutDraftSchema.parse(llmResult.data);
          mode = 'llm';
        } catch {
          /* keep rules draft */
        }
      }
    }
  }

  const validation = validateWorkoutDraft(draft, validIds);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors }, { status: 422 });
  }

  const safeDraft = workoutDraftSchema.parse(draft);

  logAiUsage({
    endpoint: 'workout-draft',
    trainerId: auth.user.id,
    clientId: input.client_id,
    mode,
    durationMs: Date.now() - start,
    sessionCount: safeDraft.sessions.length,
  });

  return NextResponse.json({ draft: safeDraft, mode });
}
