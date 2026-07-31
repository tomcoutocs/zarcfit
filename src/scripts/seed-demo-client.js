// Seeds a fully-populated demo client under a trainer account so the client
// detail page can be reviewed with realistic data in every tab.
//
// Usage: npm run seed:demo-client -- --trainer you@example.com
//        npm run seed:demo-client -- --trainer you@example.com --reset
//
// Requires SUPABASE_SERVICE_ROLE_KEY: this bypasses RLS and creates an auth
// user, which the anon key cannot do.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_EMAIL = process.env.DEMO_CLIENT_EMAIL || 'demo.client@zarcfit.com';
const DEMO_PASSWORD = process.env.DEMO_CLIENT_PASSWORD || 'DemoClient!2026';
const DEMO_FIRST_NAME = 'Jordan';
const DEMO_LAST_NAME = 'Reyes';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Add both to .env.local. The service role key is in Supabase → Settings → API.');
  process.exit(1);
}

const args = process.argv.slice(2);
const trainerEmail = args[args.indexOf('--trainer') + 1];
const reset = args.includes('--reset');

if (!trainerEmail || trainerEmail.startsWith('--')) {
  console.error('Usage: npm run seed:demo-client -- --trainer you@example.com [--reset]');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** ISO date N days before today. */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function check(label, error) {
  if (error) {
    console.error(`  ✗ ${label}: ${error.message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${label}`);
}

/** Page through auth users to find one by email. */
async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function resolveTrainer() {
  const trainer = await findAuthUserByEmail(trainerEmail);
  if (!trainer) {
    console.error(`No account found for ${trainerEmail}. Sign up as a trainer first.`);
    process.exit(1);
  }

  const { data: roles } = await db
    .from('user_roles')
    .select('role')
    .eq('user_id', trainer.id);

  if (!(roles || []).some((r) => r.role === 'trainer')) {
    console.error(`${trainerEmail} exists but is not a trainer.`);
    process.exit(1);
  }

  return trainer.id;
}

async function resolveDemoClient() {
  const existing = await findAuthUserByEmail(DEMO_EMAIL);
  if (existing) {
    console.log(`  · Reusing existing demo account ${DEMO_EMAIL}`);
    return existing.id;
  }

  const { data, error } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: DEMO_FIRST_NAME, last_name: DEMO_LAST_NAME },
  });
  check('Created demo auth user', error);
  return data.user.id;
}

/**
 * Remove previously seeded rows. Cascades handle sessions, exercises, and
 * meals, so only the top-level rows need deleting.
 */
async function clearDemoData(clientId, trainerId) {
  const { data: logs } = await db.from('workout_logs').select('id').eq('user_id', clientId);
  const logIds = (logs || []).map((l) => l.id);
  if (logIds.length) await db.from('exercise_logs').delete().in('workout_log_id', logIds);

  await db.from('workout_logs').delete().eq('user_id', clientId);
  await db.from('program_assignments').delete().eq('client_id', clientId);
  await db.from('workout_programs').delete().eq('user_id', clientId);
  await db.from('nutrition_plans').delete().eq('user_id', clientId);
  await db.from('progress_tracking').delete().eq('user_id', clientId);
  await db.from('food_diary_entries').delete().eq('user_id', clientId);
  await db.from('goals').delete().eq('user_id', clientId);
  await db.from('sleep_tracking').delete().eq('user_id', clientId);
  await db.from('client_notes').delete().eq('client_id', clientId).eq('trainer_id', trainerId);
  console.log('  ✓ Cleared previous demo data');
}

async function seedProfile(clientId) {
  const { error } = await db.from('user_profiles').upsert(
    {
      id: clientId,
      first_name: DEMO_FIRST_NAME,
      last_name: DEMO_LAST_NAME,
      bio: 'Desk job, training 4x/week. Wants to drop body fat without losing strength.',
      date_of_birth: '1992-04-18',
      gender: 'male',
      height_cm: 178,
    },
    { onConflict: 'id' }
  );
  check('Client profile', error);

  const { error: roleError } = await db
    .from('user_roles')
    .upsert({ user_id: clientId, role: 'client' }, { onConflict: 'user_id,role' });
  check('Client role', roleError);
}

async function seedRelationship(trainerId, clientId) {
  const { error } = await db.from('trainer_clients').upsert(
    {
      trainer_id: trainerId,
      client_id: clientId,
      status: 'active',
      invited_at: `${daysAgo(90)}T09:00:00Z`,
      accepted_at: `${daysAgo(88)}T14:30:00Z`,
      notes: 'Referred by a gym member. Prefers early morning sessions.',
    },
    { onConflict: 'trainer_id,client_id' }
  );
  check('Trainer–client relationship', error);
}

const PROGRAM_TEMPLATE = [
  {
    name: 'Upper Body A',
    day: 1,
    exercises: [
      ['Bench Press', 4, '6-8', 120],
      ['Barbell Row', 4, '8-10', 90],
      ['Overhead Press', 3, '8-10', 90],
      ['Lat Pulldown', 3, '10-12', 60],
      ['Face Pull', 3, '15', 45],
    ],
  },
  {
    name: 'Lower Body A',
    day: 3,
    exercises: [
      ['Squat', 4, '5-6', 150],
      ['Romanian Deadlift', 3, '8-10', 120],
      ['Walking Lunge', 3, '12', 60],
      ['Leg Curl', 3, '12-15', 60],
      ['Calf Raise', 4, '15', 45],
    ],
  },
  {
    name: 'Full Body B',
    day: 5,
    exercises: [
      ['Deadlift', 3, '5', 180],
      ['Incline Dumbbell Press', 3, '8-10', 90],
      ['Pull-Up', 3, 'AMRAP', 90],
      ['Plank', 3, '45s', 45],
    ],
  },
];

async function seedProgram(trainerId, clientId) {
  const { data: program, error } = await db
    .from('workout_programs')
    .insert({
      user_id: clientId,
      name: '12-Week Recomposition',
      description:
        'Three full sessions per week built around compound lifts, with accessory volume to bring up the posterior chain.',
      difficulty: 'intermediate',
      goal: 'Lose body fat while maintaining strength',
      duration_weeks: 12,
      sessions_per_week: 3,
      is_active: true,
      is_template: false,
      created_by_trainer_id: trainerId,
    })
    .select()
    .single();
  check('Workout program', error);

  const { data: library } = await db.from('exercises').select('id, name');
  const byName = new Map((library || []).map((e) => [e.name.toLowerCase(), e.id]));

  const sessionIds = [];
  for (let week = 1; week <= 3; week++) {
    for (const template of PROGRAM_TEMPLATE) {
      const { data: session, error: sessionError } = await db
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          name: template.name,
          day_of_week: template.day,
          week_number: week,
          notes: week === 1 ? 'Leave 2 reps in reserve on the first week.' : null,
        })
        .select()
        .single();
      if (sessionError) {
        console.error(`  ✗ Session ${template.name} wk${week}: ${sessionError.message}`);
        process.exit(1);
      }

      const rows = template.exercises
        .map(([name, sets, reps, rest], index) => {
          const exerciseId = byName.get(name.toLowerCase());
          if (!exerciseId) return null;
          return {
            workout_session_id: session.id,
            exercise_id: exerciseId,
            sets,
            reps,
            rest_seconds: rest,
            order_index: index,
          };
        })
        .filter(Boolean);

      if (rows.length) await db.from('workout_exercises').insert(rows);
      sessionIds.push({ id: session.id, week, name: template.name, exercises: rows });
    }
  }
  check(`Program structure (${sessionIds.length} sessions)`, null);

  const { error: assignError } = await db.from('program_assignments').insert({
    program_id: program.id,
    client_id: clientId,
    assigned_by: trainerId,
    start_date: daysAgo(21),
    status: 'active',
    notes: 'Start at 70% of previous maxes and build.',
  });
  check('Program assignment', assignError);

  return sessionIds;
}

async function seedWorkoutLogs(clientId, sessions) {
  // Three weeks of history, skipping one session to make adherence realistic.
  const schedule = [
    { session: 0, day: 20, rating: 4 },
    { session: 1, day: 18, rating: 4 },
    { session: 2, day: 16, rating: 3 },
    { session: 3, day: 13, rating: 5 },
    { session: 4, day: 11, rating: 4 },
    { session: 6, day: 6, rating: 4 },
    { session: 7, day: 4, rating: 5 },
    { session: 8, day: 2, rating: 3 },
  ];

  let exerciseLogCount = 0;
  for (const entry of schedule) {
    const session = sessions[entry.session];
    if (!session) continue;

    const { data: log, error } = await db
      .from('workout_logs')
      .insert({
        user_id: clientId,
        workout_session_id: session.id,
        date: daysAgo(entry.day),
        duration_minutes: 55 + (entry.day % 3) * 5,
        rating: entry.rating,
        notes: entry.rating >= 4 ? 'Felt strong, bar speed was good.' : 'Low energy, cut the last set.',
      })
      .select()
      .single();
    if (error) {
      console.error(`  ✗ Workout log: ${error.message}`);
      process.exit(1);
    }

    const base = session.exercises.map((ex, index) => ({
      workout_log_id: log.id,
      exercise_id: ex.exercise_id,
      sets_completed: ex.sets,
      reps_completed: ex.reps,
      weight_used: `${40 + index * 15} kg`,
    }));

    if (base.length) {
      const withRatings = base.map((row, index) => ({
        ...row,
        difficulty_rating: Math.min(5, 2 + ((entry.day + index) % 4)),
      }));

      const { error: logError } = await db.from('exercise_logs').insert(withRatings);
      if (logError) {
        // difficulty_rating ships in an optional migration; fall back without it.
        await db.from('exercise_logs').insert(base);
      }
      exerciseLogCount += base.length;
    }
  }
  check(`Workout history (${schedule.length} sessions, ${exerciseLogCount} exercise logs)`, null);
}

async function seedProgress(clientId) {
  const rows = [
    { day: 84, weight: 92.4, bf: 24.1, waist: 96 },
    { day: 70, weight: 91.2, bf: 23.4, waist: 94.5 },
    { day: 56, weight: 90.1, bf: 22.6, waist: 93 },
    { day: 42, weight: 89.4, bf: 22.0, waist: 92 },
    { day: 28, weight: 88.2, bf: 21.2, waist: 90.5 },
    { day: 14, weight: 87.5, bf: 20.6, waist: 89 },
    { day: 3, weight: 86.8, bf: 20.1, waist: 88 },
  ].map((r) => ({
    user_id: clientId,
    date: daysAgo(r.day),
    weight_kg: r.weight,
    body_fat_percentage: r.bf,
    waist_cm: r.waist,
    chest_cm: 106,
    arms_cm: 38.5,
    legs_cm: 60,
  }));

  const { error } = await db.from('progress_tracking').insert(rows);
  check(`Progress entries (${rows.length})`, error);

  const { error: goalError } = await db.from('goals').insert([
    {
      user_id: clientId,
      title: 'Reach 84 kg',
      category: 'weight',
      target_value: 84,
      current_value: 86.8,
      unit: 'kg',
      start_date: daysAgo(84),
      target_date: daysAgo(-42),
    },
    {
      user_id: clientId,
      title: 'Squat 140 kg for 5',
      category: 'strength',
      target_value: 140,
      current_value: 115,
      unit: 'kg',
      start_date: daysAgo(84),
      target_date: daysAgo(-60),
    },
  ]);
  check('Goals', goalError);
}

const DAY_MEALS = [
  ['breakfast', 'Greek yogurt, berries, granola', 480, 38, 52, 12],
  ['lunch', 'Chicken burrito bowl', 680, 52, 68, 20],
  ['dinner', 'Salmon, sweet potato, broccoli', 720, 48, 62, 28],
  ['snack', 'Whey shake + banana', 320, 30, 38, 4],
];

async function seedNutrition(trainerId, clientId) {
  const { data: plan, error } = await db
    .from('nutrition_plans')
    .insert({
      user_id: clientId,
      name: 'Recomp — 2,200 kcal',
      description: 'Moderate deficit with protein held high to protect lean mass.',
      daily_calories: 2200,
      protein_grams: 168,
      carbs_grams: 220,
      fat_grams: 64,
      is_active: true,
      is_template: false,
      created_by_trainer_id: trainerId,
    })
    .select()
    .single();
  check('Nutrition plan', error);

  let mealCount = 0;
  for (let day = 1; day <= 5; day++) {
    const { data: dayPlan, error: dayError } = await db
      .from('meal_plans')
      .insert({
        nutrition_plan_id: plan.id,
        name: `Day ${day}`,
        day_of_week: day,
        notes: day === 1 ? 'Training day — keep carbs around the session.' : null,
      })
      .select()
      .single();
    if (dayError) {
      console.error(`  ✗ Meal plan day ${day}: ${dayError.message}`);
      process.exit(1);
    }

    const rows = DAY_MEALS.map(([type, name, cal, p, c, f]) => ({
      meal_plan_id: dayPlan.id,
      name,
      meal_type: type,
      calories: cal,
      protein_grams: p,
      carbs_grams: c,
      fat_grams: f,
    }));
    await db.from('meals').insert(rows);
    mealCount += rows.length;
  }
  check(`Meal plan (5 days, ${mealCount} meals)`, null);

  // Food diary for 5 of the last 7 days so the adherence widget shows 5/7.
  const diaryRows = [];
  for (const day of [1, 2, 3, 5, 6]) {
    for (const [type, name, cal, p, c, f] of DAY_MEALS) {
      diaryRows.push({
        user_id: clientId,
        logged_date: daysAgo(day),
        meal_type: type,
        food_name: name,
        serving_description: '1 serving',
        calories: cal,
        protein_grams: p,
        carbs_grams: c,
        fat_grams: f,
      });
    }
  }
  const { error: diaryError } = await db.from('food_diary_entries').insert(diaryRows);
  check(`Food diary (${diaryRows.length} entries across 5 days)`, diaryError);
}

async function seedNotes(trainerId, clientId) {
  const { error } = await db.from('client_notes').insert([
    {
      trainer_id: trainerId,
      client_id: clientId,
      note_type: 'injury',
      content: 'Left shoulder impingement from 2023. Avoid behind-the-neck pressing; incline over flat when it flares up.',
      is_pinned: true,
    },
    {
      trainer_id: trainerId,
      client_id: clientId,
      note_type: 'preference',
      content: 'Trains 6am before work. Hates burpees, happy with sled and carries.',
      is_pinned: true,
    },
    {
      trainer_id: trainerId,
      client_id: clientId,
      note_type: 'achievement',
      content: 'First bodyweight pull-up set of 8 this week.',
      is_pinned: false,
    },
    {
      trainer_id: trainerId,
      client_id: clientId,
      note_type: 'general',
      content: 'Travelling for work the last week of the month — plan two hotel-gym sessions.',
      is_pinned: false,
    },
  ]);
  check('Client notes (4)', error);
}

async function seedSleep(clientId) {
  const rows = [];
  for (let day = 1; day <= 14; day++) {
    rows.push({
      user_id: clientId,
      date: daysAgo(day),
      sleep_duration_hours: 6.2 + ((day % 5) * 0.4),
      sleep_quality: 2 + (day % 4),
      sleep_disruptions: day % 3,
    });
  }
  const { error } = await db.from('sleep_tracking').insert(rows);
  check(`Sleep tracking (${rows.length} nights)`, error);
}

async function main() {
  console.log('\n=== Seeding demo client ===\n');

  const trainerId = await resolveTrainer();
  console.log(`  ✓ Trainer ${trainerEmail}`);

  const clientId = await resolveDemoClient();

  if (reset) await clearDemoData(clientId, trainerId);

  await seedProfile(clientId);
  await seedRelationship(trainerId, clientId);
  const sessions = await seedProgram(trainerId, clientId);
  await seedWorkoutLogs(clientId, sessions);
  await seedProgress(clientId);
  await seedNutrition(trainerId, clientId);
  await seedNotes(trainerId, clientId);
  await seedSleep(clientId);

  console.log('\nDone.');
  console.log(`  Client page: /trainer/clients/${clientId}`);
  console.log(`  Client login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log('\nRe-run with --reset to wipe and reseed.\n');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
