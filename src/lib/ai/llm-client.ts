import type { MealDraft, WorkoutDraft } from './schemas';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export function isLlmAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type ChatJsonResult<T> = { ok: true; data: T; model: string } | { ok: false; error: string };

async function chatJson<T>(system: string, user: string): Promise<ChatJsonResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY not configured' };

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `OpenAI ${res.status}: ${errText.slice(0, 200)}` };
    }

    const payload = (await res.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: 'Empty LLM response' };

    return {
      ok: true,
      data: JSON.parse(content) as T,
      model: payload.model || DEFAULT_MODEL,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'LLM request failed' };
  }
}

export async function generateWorkoutDraftLlm(input: {
  goal: string;
  difficulty: string;
  sessionsPerWeek: number;
  durationWeeks: number;
  equipment: string;
  exerciseCatalog: { id: string; name: string; muscle_group?: string; equipment?: string }[];
  clientNotes?: string;
}): Promise<ChatJsonResult<WorkoutDraft>> {
  const catalog = input.exerciseCatalog
    .map((e) => `${e.id}|${e.name}|${e.muscle_group || '?'}|${e.equipment || '?'}`)
    .join('\n');

  const system = `You are a strength coach. Output JSON matching this shape exactly:
{"sessions":[{"name":string,"day_of_week":1-7,"week_number":1-52,"notes":string?,"exercises":[{"exercise_id":uuid,"sets":1-10,"reps":string,"rest_seconds":0-600,"notes":string?}]}],"summary":string}
Rules: use ONLY exercise_id values from the catalog. Never invent IDs.`;

  const user = `Goal: ${input.goal}
Difficulty: ${input.difficulty}
Sessions/week: ${input.sessionsPerWeek}
Weeks: ${input.durationWeeks}
Equipment: ${input.equipment}
${input.clientNotes ? `Client notes: ${input.clientNotes}` : ''}

Exercise catalog (id|name|muscle|equipment):
${catalog}`;

  return chatJson<WorkoutDraft>(system, user);
}

export async function generateMealDraftLlm(input: {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  dietaryTags?: string[];
  clientNotes?: string;
}): Promise<ChatJsonResult<MealDraft>> {
  const system = `You are a sports nutritionist. Output JSON:
{"days":[{"day_of_week":1-7,"meals":[{"meal_type":"breakfast"|"lunch"|"dinner"|"snack","name":string,"calories":number,"protein_grams":number,"carbs_grams":number,"fat_grams":number,"notes":string?}]}],"summary":string}
Each day must have 4 meals. Daily totals should be within 5% of targets.`;

  const user = `Daily targets: ${input.dailyCalories} kcal, ${input.proteinGrams}g protein, ${input.carbsGrams}g carbs, ${input.fatGrams}g fat
${input.dietaryTags?.length ? `Dietary: ${input.dietaryTags.join(', ')}` : ''}
${input.clientNotes ? `Client notes: ${input.clientNotes}` : ''}
Generate 7 days.`;

  return chatJson<MealDraft>(system, user);
}
