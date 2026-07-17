import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientContext } from '@/lib/ai/client-context';
import { logAiUsage } from '@/lib/ai/logger';
import { generateMealSkeleton, validateMealDraft } from '@/lib/ai/meal-generator';
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

  const { nutrition_plan_id, client_id } = parsed.data;
  const start = Date.now();

  if (client_id) {
    const ctx = await getClientContext(auth.supabase, auth.user.id, client_id);
    if (!ctx) {
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

  const draft = generateMealSkeleton(targets);
  const validation = validateMealDraft(draft, targets);
  const safeDraft = mealDraftSchema.parse(draft);

  logAiUsage({
    endpoint: 'meal-draft',
    trainerId: auth.user.id,
    clientId: client_id,
    mode: 'rules',
    durationMs: Date.now() - start,
    mealCount: safeDraft.days.reduce((n, d) => n + d.meals.length, 0),
  });

  return NextResponse.json({
    draft: safeDraft,
    mode: 'skeleton',
    warnings: validation.warnings,
  });
}
