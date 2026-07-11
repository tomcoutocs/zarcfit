'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Dumbbell,
  Search,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
];

type SessionExercise = WorkoutExercise & { exercises?: Exercise };

const emptySessionForm = {
  name: '',
  day_of_week: '1',
  week_number: '1',
  notes: '',
};

const emptyExerciseForm = {
  exercise_id: '',
  sets: '3',
  reps: '10',
  rest_seconds: '60',
  notes: '',
};

function dayLabel(day?: number) {
  return DAYS.find((d) => d.value === day)?.label || 'Unscheduled';
}

export default function ProgramBuilderPage() {
  const { programId } = useParams<{ programId: string }>();
  const { isTrainer } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionExercises, setSessionExercises] = useState<Record<string, SessionExercise[]>>({});
  const [openSessions, setOpenSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [exerciseForms, setExerciseForms] = useState<Record<string, typeof emptyExerciseForm>>({});
  const [exerciseSearch, setExerciseSearch] = useState<Record<string, string>>({});
  const [muscleFilter, setMuscleFilter] = useState<Record<string, string>>({});

  const loadSessionExercises = useCallback(async (sessionId: string) => {
    const detail = await workoutSessionsApi.getSessionWithExercises(sessionId);
    setSessionExercises((prev) => ({ ...prev, [sessionId]: detail?.exercises || [] }));
  }, []);

  const loadData = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    setError('');

    const [found, exerciseList, sessionList] = await Promise.all([
      workoutProgramsApi.getProgram(programId),
      exercisesApi.getAll(),
      workoutProgramsApi.getProgramSessions(programId),
    ]);

    setExercises(exerciseList);

    if (!found) {
      setError('Program not found');
      setLoading(false);
      return;
    }

    setProgram(found);
    setSessions(sessionList);

    const exerciseMap: Record<string, SessionExercise[]> = {};
    await Promise.all(
      sessionList.map(async (session) => {
        if (!session.id) return;
        const detail = await workoutSessionsApi.getSessionWithExercises(session.id);
        exerciseMap[session.id] = detail?.exercises || [];
      })
    );
    setSessionExercises(exerciseMap);
    setOpenSessions(sessionList.map((s) => s.id).filter(Boolean) as string[]);
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.muscle_group) groups.add(ex.muscle_group);
    });
    return Array.from(groups).sort();
  }, [exercises]);

  const totalExercises = useMemo(
    () => Object.values(sessionExercises).reduce((sum, list) => sum + list.length, 0),
    [sessionExercises]
  );

  const sessionsByWeek = useMemo(() => {
    const grouped: Record<number, WorkoutSession[]> = {};
    sessions.forEach((session) => {
      const week = session.week_number || 1;
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(session);
    });
    return Object.entries(grouped)
      .map(([week, weekSessions]) => ({
        week: Number(week),
        sessions: weekSessions.sort(
          (a, b) => (a.day_of_week || 0) - (b.day_of_week || 0)
        ),
      }))
      .sort((a, b) => a.week - b.week);
  }, [sessions]);

  const getExerciseForm = (sessionId: string) =>
    exerciseForms[sessionId] || emptyExerciseForm;

  const setExerciseFormForSession = (
    sessionId: string,
    updater: (prev: typeof emptyExerciseForm) => typeof emptyExerciseForm
  ) => {
    setExerciseForms((prev) => ({
      ...prev,
      [sessionId]: updater(prev[sessionId] || emptyExerciseForm),
    }));
  };

  const filteredExercises = (sessionId: string) => {
    const query = (exerciseSearch[sessionId] || '').trim().toLowerCase();
    const muscle = muscleFilter[sessionId] || 'all';
    return exercises.filter((ex) => {
      const matchesMuscle = muscle === 'all' || ex.muscle_group === muscle;
      const matchesQuery =
        !query ||
        ex.name.toLowerCase().includes(query) ||
        ex.muscle_group?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query);
      return matchesMuscle && matchesQuery;
    });
  };

  const handleAddSession = async () => {
    if (!programId || !sessionForm.name.trim()) return;
    setSavingSession(true);
    setError('');
    setSuccess('');

    const created = await workoutSessionsApi.createSession({
      program_id: programId,
      name: sessionForm.name.trim(),
      day_of_week: Number(sessionForm.day_of_week),
      week_number: Number(sessionForm.week_number) || 1,
      notes: sessionForm.notes.trim() || undefined,
    });

    setSavingSession(false);

    if (created?.id) {
      setSessionForm(emptySessionForm);
      setSuccess(`Session "${created.name}" added.`);
      await loadData();
      setOpenSessions((prev) => [...prev, created.id as string]);
    } else {
      setError('Failed to add session. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session and all its exercises?')) return;
    const ok = await workoutSessionsApi.deleteSession(sessionId);
    if (ok) {
      setSuccess('Session deleted.');
      loadData();
    } else {
      setError('Failed to delete session.');
    }
  };

  const handleAddExercise = async (sessionId: string) => {
    const form = getExerciseForm(sessionId);
    if (!form.exercise_id) return;

    const orderIndex = (sessionExercises[sessionId]?.length || 0) + 1;
    const created = await workoutSessionsApi.addExercise({
      workout_session_id: sessionId,
      exercise_id: form.exercise_id,
      sets: Number(form.sets) || undefined,
      reps: form.reps || undefined,
      rest_seconds: form.rest_seconds ? Number(form.rest_seconds) : undefined,
      notes: form.notes.trim() || undefined,
      order_index: orderIndex,
    });

    if (created) {
      setExerciseForms((prev) => ({ ...prev, [sessionId]: emptyExerciseForm }));
      setExerciseSearch((prev) => ({ ...prev, [sessionId]: '' }));
      await loadSessionExercises(sessionId);
      setSuccess('Exercise added to session.');
    } else {
      setError('Failed to add exercise.');
    }
  };

  const handleUpdateExercise = async (sessionId: string, exercise: SessionExercise) => {
    if (!exercise.id) return;
    await workoutSessionsApi.updateExercise(exercise);
    await loadSessionExercises(sessionId);
  };

  const handleDeleteExercise = async (sessionId: string, exerciseId: string) => {
    const ok = await workoutSessionsApi.deleteExercise(exerciseId);
    if (ok) await loadSessionExercises(sessionId);
  };

  const handleMoveExercise = async (
    sessionId: string,
    exercise: SessionExercise,
    direction: 'up' | 'down'
  ) => {
    const list = sessionExercises[sessionId] || [];
    const index = list.findIndex((e) => e.id === exercise.id);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= list.length) return;

    const current = list[index];
    const swap = list[swapIndex];
    if (!current.id || !swap.id) return;

    await Promise.all([
      workoutSessionsApi.updateExercise({ ...current, order_index: swapIndex + 1 }),
      workoutSessionsApi.updateExercise({ ...swap, order_index: index + 1 }),
    ]);
    await loadSessionExercises(sessionId);
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
        description="Build sessions, add exercises, and set sets, reps, and rest"
      >
        <Link href="/trainer/programs">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </Button>
        </Link>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      ) : (
        <>
          {program && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Program Overview
                    </CardTitle>
                    {program.description && (
                      <CardDescription className="mt-1">{program.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {program.is_template && <Badge variant="outline">Template</Badge>}
                    {program.difficulty && <Badge variant="secondary">{program.difficulty}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sessions</p>
                    <p className="text-xl font-semibold">{sessions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Exercises</p>
                    <p className="text-xl font-semibold">{totalExercises}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="text-xl font-semibold">
                      {program.duration_weeks ? `${program.duration_weeks} wks` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Per Week</p>
                    <p className="text-xl font-semibold">
                      {program.sessions_per_week ? `${program.sessions_per_week}x` : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Session</CardTitle>
              <CardDescription>
                Create a workout day, then add exercises below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="session_name">Session Name</Label>
                  <Input
                    id="session_name"
                    placeholder="e.g. Upper Body A, Leg Day"
                    value={sessionForm.name}
                    onChange={(e) =>
                      setSessionForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select
                    value={sessionForm.day_of_week}
                    onValueChange={(v) =>
                      setSessionForm((prev) => ({ ...prev, day_of_week: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="week_number">Week</Label>
                  <Input
                    id="week_number"
                    type="number"
                    min={1}
                    value={sessionForm.week_number}
                    onChange={(e) =>
                      setSessionForm((prev) => ({ ...prev, week_number: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_notes">Session Notes (optional)</Label>
                <Textarea
                  id="session_notes"
                  rows={2}
                  placeholder="e.g. Focus on tempo, rest 90s between sets"
                  value={sessionForm.notes}
                  onChange={(e) =>
                    setSessionForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
              <Button
                onClick={handleAddSession}
                disabled={savingSession || !sessionForm.name.trim()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {savingSession ? 'Adding...' : 'Add Session'}
              </Button>
            </CardContent>
          </Card>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No sessions yet. Add your first session above, then add exercises to it.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sessionsByWeek.map(({ week, sessions: weekSessions }) => (
                <div key={week} className="space-y-3">
                  <h3 className="text-lg font-semibold">Week {week}</h3>
                  <Accordion
                    type="multiple"
                    value={openSessions}
                    onValueChange={setOpenSessions}
                    className="space-y-3"
                  >
                    {weekSessions.map((session) => {
                      if (!session.id) return null;
                      const sessionId = session.id;
                      const exercisesInSession = sessionExercises[sessionId] || [];
                      const form = getExerciseForm(sessionId);
                      const options = filteredExercises(sessionId);

                      return (
                        <AccordionItem
                          key={sessionId}
                          value={sessionId}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex flex-1 items-center justify-between gap-3 pr-4 text-left">
                              <div>
                                <p className="font-medium">{session.name}</p>
                                <p className="text-sm text-muted-foreground font-normal">
                                  {dayLabel(session.day_of_week)} · {exercisesInSession.length}{' '}
                                  exercise{exercisesInSession.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                {DAYS.find((d) => d.value === session.day_of_week)?.short}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pb-4">
                            {session.notes && (
                              <p className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">
                                {session.notes}
                              </p>
                            )}

                            {exercisesInSession.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No exercises in this session yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {exercisesInSession.map((we, index) => (
                                  <div
                                    key={we.id}
                                    className="border rounded-lg p-3 space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-medium text-sm">
                                          {we.exercises?.name || 'Exercise'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {we.exercises?.muscle_group || 'General'}
                                          {we.exercises?.equipment
                                            ? ` · ${we.exercises.equipment}`
                                            : ''}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          disabled={index === 0}
                                          onClick={() =>
                                            handleMoveExercise(sessionId, we, 'up')
                                          }
                                        >
                                          <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          disabled={index === exercisesInSession.length - 1}
                                          onClick={() =>
                                            handleMoveExercise(sessionId, we, 'down')
                                          }
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() =>
                                            we.id && handleDeleteExercise(sessionId, we.id)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Sets</Label>
                                        <Input
                                          type="number"
                                          defaultValue={we.sets ?? ''}
                                          onBlur={(e) =>
                                            handleUpdateExercise(sessionId, {
                                              ...we,
                                              sets: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Reps</Label>
                                        <Input
                                          defaultValue={we.reps ?? ''}
                                          placeholder="8-10"
                                          onBlur={(e) =>
                                            handleUpdateExercise(sessionId, {
                                              ...we,
                                              reps: e.target.value || undefined,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Rest (sec)</Label>
                                        <Input
                                          type="number"
                                          defaultValue={we.rest_seconds ?? ''}
                                          onBlur={(e) =>
                                            handleUpdateExercise(sessionId, {
                                              ...we,
                                              rest_seconds: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Notes</Label>
                                        <Input
                                          defaultValue={we.notes ?? ''}
                                          placeholder="Optional"
                                          onBlur={(e) =>
                                            handleUpdateExercise(sessionId, {
                                              ...we,
                                              notes: e.target.value || undefined,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                              <p className="text-sm font-medium">Add Exercise</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-xs">Search</Label>
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      className="pl-8"
                                      placeholder="Search exercises..."
                                      value={exerciseSearch[sessionId] || ''}
                                      onChange={(e) =>
                                        setExerciseSearch((prev) => ({
                                          ...prev,
                                          [sessionId]: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Muscle Group</Label>
                                  <Select
                                    value={muscleFilter[sessionId] || 'all'}
                                    onValueChange={(v) =>
                                      setMuscleFilter((prev) => ({
                                        ...prev,
                                        [sessionId]: v,
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="All groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All groups</SelectItem>
                                      {muscleGroups.map((group) => (
                                        <SelectItem key={group} value={group}>
                                          {group}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Exercise</Label>
                                <Select
                                  value={form.exercise_id}
                                  onValueChange={(v) =>
                                    setExerciseFormForSession(sessionId, (prev) => ({
                                      ...prev,
                                      exercise_id: v,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select exercise" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.length === 0 ? (
                                      <SelectItem value="none" disabled>
                                        No exercises match
                                      </SelectItem>
                                    ) : (
                                      options.map((ex) => (
                                        <SelectItem key={ex.id} value={ex.id as string}>
                                          {ex.name}
                                          {ex.muscle_group ? ` (${ex.muscle_group})` : ''}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Sets</Label>
                                  <Input
                                    type="number"
                                    value={form.sets}
                                    onChange={(e) =>
                                      setExerciseFormForSession(sessionId, (prev) => ({
                                        ...prev,
                                        sets: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Reps</Label>
                                  <Input
                                    value={form.reps}
                                    placeholder="8-10"
                                    onChange={(e) =>
                                      setExerciseFormForSession(sessionId, (prev) => ({
                                        ...prev,
                                        reps: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Rest (sec)</Label>
                                  <Input
                                    type="number"
                                    value={form.rest_seconds}
                                    onChange={(e) =>
                                      setExerciseFormForSession(sessionId, (prev) => ({
                                        ...prev,
                                        rest_seconds: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Notes</Label>
                                  <Input
                                    value={form.notes}
                                    placeholder="Optional"
                                    onChange={(e) =>
                                      setExerciseFormForSession(sessionId, (prev) => ({
                                        ...prev,
                                        notes: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => session.id && handleDeleteSession(session.id)}
                                >
                                  Delete Session
                                </Button>
                                <Button
                                  onClick={() => handleAddExercise(sessionId)}
                                  disabled={!form.exercise_id || form.exercise_id === 'none'}
                                  className="gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Exercise
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
