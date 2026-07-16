import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

type HealthPayload = {
  sleep?: Array<{ date: string; hours: number }>;
  weight?: Array<{ date: string; kg: number }>;
  workouts?: Array<{ date: string; name?: string; duration_minutes?: number; notes?: string }>;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`health-import:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec ?? 60) } }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const { data: keyRow, error: keyError } = await supabaseAdmin
    .from('health_import_keys')
    .select('user_id')
    .eq('api_key', apiKey)
    .single();

  if (keyError || !keyRow) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  let payload: HealthPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const userId = keyRow.user_id;
  const results = { sleep: 0, weight: 0, workouts: 0 };

  if (payload.sleep?.length) {
    for (const entry of payload.sleep) {
      const { data: existing } = await supabaseAdmin
        .from('sleep_tracking')
        .select('id')
        .eq('user_id', userId)
        .eq('date', entry.date)
        .maybeSingle();

      const { error } = existing
        ? await supabaseAdmin.from('sleep_tracking').update({ sleep_duration_hours: entry.hours }).eq('id', existing.id)
        : await supabaseAdmin.from('sleep_tracking').insert({ user_id: userId, date: entry.date, sleep_duration_hours: entry.hours });

      if (!error) results.sleep++;
    }
  }

  if (payload.weight?.length) {
    for (const entry of payload.weight) {
      const { error } = await supabaseAdmin.from('progress_tracking').insert({
        user_id: userId,
        date: entry.date,
        weight_kg: entry.kg,
      });
      if (!error) results.weight++;
    }
  }

  if (payload.workouts?.length) {
    for (const entry of payload.workouts) {
      const { error } = await supabaseAdmin.from('workout_logs').insert({
        user_id: userId,
        date: entry.date,
        duration_minutes: entry.duration_minutes,
        notes: entry.notes || (entry.name ? `Imported: ${entry.name}` : 'Imported workout'),
      });
      if (!error) results.workouts++;
    }
  }

  await supabaseAdmin
    .from('health_import_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId);

  return NextResponse.json({ success: true, imported: results });
}