'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  workoutLogsApi,
  exerciseLogsApi,
  exercisesApi,
  WorkoutLog,
  ExerciseLog,
} from '@/lib/supabase/dashboard-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type WorkoutAnalyticsProps = {
  userId: string;
};

function parseWeight(weight?: string): number {
  if (!weight) return 0;
  const match = weight.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

export function WorkoutAnalytics({ userId }: WorkoutAnalyticsProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [logData, exerciseList] = await Promise.all([
        workoutLogsApi.getUserLogs(userId, 100),
        exercisesApi.getAll(),
      ]);

      setLogs(logData);

      const nameMap: Record<string, string> = {};
      exerciseList.forEach((e) => {
        if (e.id) nameMap[e.id] = e.name;
      });
      setExerciseNames(nameMap);

      const allExerciseLogs = await Promise.all(
        logData
          .filter((l) => l.id)
          .map((l) => exerciseLogsApi.getLogsForWorkout(l.id!))
      );
      setExerciseLogs(allExerciseLogs.flat());
      setLoading(false);
    }

    load();
  }, [userId]);

  const weeklyVolume = useMemo(() => {
    const byWeek = new Map<string, number>();

    for (const log of logs) {
      const week = getWeekKey(log.date);
      const logEntries = exerciseLogs.filter((e) => e.workout_log_id === log.id);
      let volume = 0;
      for (const entry of logEntries) {
        const weight = parseWeight(entry.weight_used);
        const sets = entry.sets_completed || 1;
        const repsMatch = entry.reps_completed?.match(/\d+/);
        const reps = repsMatch ? Number(repsMatch[0]) : 1;
        volume += weight * sets * reps;
      }
      byWeek.set(week, (byWeek.get(week) || 0) + volume);
    }

    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, volume]) => ({
        week: new Date(week + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        volume: Math.round(volume),
      }));
  }, [logs, exerciseLogs]);

  const personalRecords = useMemo(() => {
    const maxByExercise = new Map<string, { weight: number; reps?: string }>();

    for (const entry of exerciseLogs) {
      if (!entry.exercise_id) continue;
      const weight = parseWeight(entry.weight_used);
      if (weight <= 0) continue;
      const current = maxByExercise.get(entry.exercise_id);
      if (!current || weight > current.weight) {
        maxByExercise.set(entry.exercise_id, {
          weight,
          reps: entry.reps_completed,
        });
      }
    }

    return Array.from(maxByExercise.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        name: exerciseNames[exerciseId] || 'Exercise',
        maxWeight: data.weight,
        reps: data.reps,
      }))
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 10);
  }, [exerciseLogs, exerciseNames]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Log workouts to see analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {weeklyVolume.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Volume
            </CardTitle>
            <CardDescription>Total weight × reps per week (approx.)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyVolume}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Personal Records
          </CardTitle>
          <CardDescription>Max weight logged per exercise</CardDescription>
        </CardHeader>
        <CardContent>
          {personalRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Log weights to track PRs
            </p>
          ) : (
            <div className="space-y-2">
              {personalRecords.map((pr) => (
                <div
                  key={pr.exerciseId}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <span className="font-medium">{pr.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{pr.maxWeight} lb/kg</Badge>
                    {pr.reps && (
                      <span className="text-muted-foreground">{pr.reps} reps</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
