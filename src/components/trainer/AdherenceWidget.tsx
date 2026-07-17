'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, Dumbbell } from 'lucide-react';
import { foodDiaryApi } from '@/lib/supabase/food-diary-api';
import type { WorkoutLog } from '@/lib/supabase/dashboard-api';

type Props = {
  clientId: string;
  logs: WorkoutLog[];
  expectedWorkoutsPerWeek?: number;
  onDiaryDaysChange?: (days: number) => void;
};

function last7Dates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function AdherenceWidget({
  clientId,
  logs,
  expectedWorkoutsPerWeek = 3,
  onDiaryDaysChange,
}: Props) {
  const [diaryDays, setDiaryDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const dates = last7Dates();
      const uniqueDays = new Set<string>();
      await Promise.all(
        dates.map(async (date) => {
          const entries = await foodDiaryApi.getEntriesForDate(clientId, date);
          if (entries.length > 0) uniqueDays.add(date);
        })
      );
      if (!cancelled) {
        setDiaryDays(uniqueDays.size);
        onDiaryDaysChange?.(uniqueDays.size);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clientId, onDiaryDaysChange]);

  const weekDates = last7Dates();
  const weekStart = weekDates[0];
  const workoutDays = new Set(
    logs.filter((l) => l.date >= weekStart).map((l) => l.date)
  ).size;

  const workoutPct = Math.min(100, Math.round((workoutDays / expectedWorkoutsPerWeek) * 100));
  const diaryPct = Math.round((diaryDays / 7) * 100);

  function Bar({ value }: { value: number }) {
    return (
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">7-day adherence</CardTitle>
        <CardDescription>Workouts vs plan · food diary consistency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              Workouts
            </span>
            <span className="font-medium">
              {workoutDays} / {expectedWorkoutsPerWeek} days
            </span>
          </div>
          <Bar value={workoutPct} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-muted-foreground" />
              Food diary
            </span>
            <span className="font-medium">
              {loading ? '…' : `${diaryDays} / 7 days`}
            </span>
          </div>
          <Bar value={loading ? 0 : diaryPct} />
        </div>
      </CardContent>
    </Card>
  );
}
