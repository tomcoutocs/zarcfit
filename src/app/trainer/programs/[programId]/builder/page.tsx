'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  workoutProgramsApi,
  workoutSessionsApi,
  exercisesApi,
  WorkoutProgram,
  WorkoutSession,
  WorkoutExercise,
  Exercise,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function ProgramBuilderPage() {
  const { programId } = useParams<{ programId: string }>();
  const { isTrainer } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionExercises, setSessionExercises] = useState<Record<string, (WorkoutExercise & { exercises?: Exercise })[]>>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionForm, setSessionForm] = useState({ name: '', day_of_week: '1', week_number: '1' });
  const [exerciseForm, setExerciseForm] = useState({ exercise_id: '', sets: '3', reps: '10' });

  const loadData = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    const [found, exerciseList] = await Promise.all([
      workoutProgramsApi.getProgram(programId),
      exercisesApi.getAll(),
    ]);
    setExercises(exerciseList);

    if (!found) {
      setError('Program not found');
      setLoading(false);
      return;
    }
    setProgram(found);

    const sessionList = await workoutProgramsApi.getProgramSessions(programId);
    setSessions(sessionList);
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadSessionExercises = async (sessionId: string) => {
    const detail = await workoutSessionsApi.getSessionWithExercises(sessionId);
    setSessionExercises(prev => ({ ...prev, [sessionId]: detail?.exercises || [] }));
  };

  const handleAddSession = async () => {
    if (!programId || !sessionForm.name.trim()) return;
    const created = await workoutSessionsApi.createSession({
      program_id: programId,
      name: sessionForm.name.trim(),
      day_of_week: Number(sessionForm.day_of_week),
      week_number: Number(sessionForm.week_number),
    });
    if (created) {
      setSessionForm({ name: '', day_of_week: '1', week_number: '1' });
      loadData();
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session and its exercises?')) return;
    await workoutSessionsApi.deleteSession(sessionId);
    loadData();
  };

  const handleAddExercise = async (sessionId: string) => {
    if (!exerciseForm.exercise_id) return;
    const orderIndex = (sessionExercises[sessionId]?.length || 0) + 1;
    const created = await workoutSessionsApi.addExercise({
      workout_session_id: sessionId,
      exercise_id: exerciseForm.exercise_id,
      sets: Number(exerciseForm.sets) || undefined,
      reps: exerciseForm.reps || undefined,
      order_index: orderIndex,
    });
    if (created) {
      setExerciseForm({ exercise_id: '', sets: '3', reps: '10' });
      loadSessionExercises(sessionId);
    }
  };

  const handleDeleteExercise = async (sessionId: string, exerciseId: string) => {
    await workoutSessionsApi.deleteExercise(exerciseId);
    loadSessionExercises(sessionId);
  };

  if (!isTrainer) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Trainer access required.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={program?.name || 'Program Builder'}
        description="Add sessions and exercises to this program"
      >
        <Link href="/trainer/programs">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </Button>
        </Link>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Session</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Session name (e.g. Upper Body A)"
                value={sessionForm.name}
                onChange={(e) => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <Select value={sessionForm.day_of_week} onValueChange={(v) => setSessionForm(prev => ({ ...prev, day_of_week: v }))}>
                <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                    <SelectItem key={d} value={String(i + 1)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                className="w-full sm:w-[100px]"
                placeholder="Week"
                value={sessionForm.week_number}
                onChange={(e) => setSessionForm(prev => ({ ...prev, week_number: e.target.value }))}
              />
              <Button onClick={handleAddSession} className="gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No sessions yet. Add your first session above.
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{session.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Week {session.week_number} · Day {session.day_of_week}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!session.id) return;
                            setExpandedSessionId(expandedSessionId === session.id ? null : session.id);
                            if (expandedSessionId !== session.id) await loadSessionExercises(session.id);
                          }}
                        >
                          Exercises
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => session.id && handleDeleteSession(session.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedSessionId === session.id && session.id && (
                    <CardContent className="space-y-3 border-t pt-4">
                      {(sessionExercises[session.id] || []).map((we) => (
                        <div key={we.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                          <span>{we.exercises?.name || 'Exercise'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{we.sets}×{we.reps}</span>
                            <Button size="icon" variant="ghost" onClick={() => we.id && handleDeleteExercise(session.id!, we.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Select value={exerciseForm.exercise_id} onValueChange={(v) => setExerciseForm(prev => ({ ...prev, exercise_id: v }))}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Select exercise" /></SelectTrigger>
                          <SelectContent>
                            {exercises.map(ex => (
                              <SelectItem key={ex.id} value={ex.id as string}>{ex.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input placeholder="Sets" className="w-20" value={exerciseForm.sets} onChange={(e) => setExerciseForm(prev => ({ ...prev, sets: e.target.value }))} />
                        <Input placeholder="Reps" className="w-24" value={exerciseForm.reps} onChange={(e) => setExerciseForm(prev => ({ ...prev, reps: e.target.value }))} />
                        <Button onClick={() => handleAddExercise(session.id!)} disabled={!exerciseForm.exercise_id}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
