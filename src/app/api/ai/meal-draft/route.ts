import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientContext } from '@/lib/ai/client-context';
import { logAiUsage } from '@/lib/ai/logger';
import { generateMealDraftLlm, isLlmAvailable } from '@/lib/ai/llm-client';
import { generateMealSkeleton, validateMealDraft, findDietaryViolations } from '@/lib/ai/meal-generator';
import { mealDraftRequestSchema, mealDraftSchema } from '@/lib/ai/schemas';

export async function POST(request: Request) {
  const auth = await requireTrainer();
  if ('response' in auth) return auth.response;

  const rl = rateLimit(`ai-meal:${auth.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = mealDraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { nutrition_plan_id, client_id, dietary_tags } = parsed.data;
  const start = Date.now();
  let clientContext = null;

  if (client_id) {
    clientContext = await getClientContext(auth.supabase, auth.user.id, client_id);
    if (!clientContext) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
  }

  const { data: plan, error: planError } = await auth.supabase
    .from('nutrition_plans')
    .select('id, daily_calories, protein_grams, carbs_grams, fat_grams, created_by_trainer_id')
    .eq('id', nutrition_plan_id)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 });
  }

  if (plan.created_by_trainer_id && plan.created_by_trainer_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!plan.daily_calories || !plan.protein_grams) {
    return NextResponse.json({ error: 'Set macro targets on the plan first' }, { status: 400 });
  }

  const targets = {
    daily_calories: plan.daily_calories,
    protein_grams: plan.protein_grams,
    carbs_grams: plan.carbs_grams || 0,
    fat_grams: plan.fat_grams || 0,
  };

  let mode: 'rules' | 'llm' = 'rules';
  let draft = generateMealSkeleton(targets, dietary_tags);

  // Default to the LLM path whenever a key is configured — opt out with
  // use_ai: false rather than opt in (PF-244).
  const wantLlm = parsed.data.use_ai !== false && isLlmAvailable();
  if (wantLlm) {
    const notes = clientContext?.notes.map((n) => n.content).join('; ');
    const llmResult = await generateMealDraftLlm({
      dailyCalories: targets.daily_calories,
      proteinGrams: targets.protein_grams,
      carbsGrams: targets.carbs_grams,
      fatGrams: targets.fat_grams,
      dietaryTags: dietary_tags,
      clientNotes: notes,
    });

    if (llmResult.ok) {
      try {
        draft = mealDraftSchema.parse(llmResult.data);
        mode = 'llm';
      } catch {
        /* keep skeleton */
      }
    }
  }

  // Reject drafts that clearly violate a vegan/vegetarian restriction —
  // fall back to the rules-based (vegan-safe) skeleton rather than showing
  // the trainer a plan with meat in it (PF-243).
  let dietaryWarning: string | null = null;
  let violations = findDietaryViolations(draft, dietary_tags);
  if (violations.length > 0) {
    const rejectedMode = mode;
    draft = generateMealSkeleton(targets, dietary_tags);
    mode = 'rules';
    violations = findDietaryViolations(draft, dietary_tags);
    dietaryWarning =
      rejectedMode === 'llm'
        ? 'The AI draft contained ingredients that violate the dietary restrictions, so a compliant skeleton was used instead.'
        : 'Some skeleton meals violated the dietary restrictions and were swapped for compliant options.';
  }

  const validation = validateMealDraft(draft, targets);
  const safeDraft = mealDraftSchema.parse(draft);
  const warnings = [...(dietaryWarning ? [dietaryWarning] : []), ...validation.warnings, ...violations];

  logAiUsage({
    endpoint: 'meal-draft',
    trainerId: auth.user.id,
    clientId: client_id,
    mode,
    durationMs: Date.now() - start,
    mealCount: safeDraft.days.reduce((n, d) => n + d.meals.length, 0),
  });

  return NextResponse.json({
    draft: safeDraft,
    mode: mode === 'llm' ? 'llm' : 'skeleton',
    warnings,
  });
}
