'use client';

import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { ClientContextStrip } from '@/components/trainer/ClientContextStrip';
import GenerateWorkoutDraftButton from '@/components/trainer/GenerateWorkoutDraftButton';
import RegenerateWeekButton from '@/components/trainer/RegenerateWeekButton';
import { ExerciseLibraryPane } from '@/components/trainer/builder/ExerciseLibraryPane';
import { SortableExerciseRow } from '@/components/trainer/builder/SortableExerciseRow';
import {
  ExerciseEditDialog,
  type SessionExercise,
} from '@/components/trainer/builder/ExerciseEditDialog';
import { swapExerciseSuggestion } from '@/lib/ai/workout-generator';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  workoutProgramsApi,
  workoutSessionsApi,
  exercisesApi,
  WorkoutProgram,
  WorkoutSession,
  Exercise,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Dumbbell, Layers, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
];

function dayShort(day?: number) {
  return DAYS.find((d) => d.value === day)?.short || '?';
}

function SessionDropZone({
  sessionId,
  children,
  isEmpty,
}: {
  sessionId: string;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `session-${sessionId}`,
    data: { type: 'session', sessionId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[48px] space-y-1.5 rounded-md p-1 transition-colors',
        isOver && 'bg-primary/10 ring-1 ring-primary/40',
        isEmpty && 'border border-dashed border-muted-foreground/30'
      )}
    >
      {isEmpty ? (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground">
          Drop exercises here
        </p>
      ) : null}
      {children}
    </div>
  );
}

export default function ProgramBuilderPage() {
  const { programId } = useParams<{ programId: string }>();
  const { isTrainer } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionExercises, setSessionExercises] = useState<Record<string, SessionExercise[]>>({});
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingSession, setSavingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    day_of_week: '1',
    week_number: '1',
  });
  const [libSearch, setLibSearch] = useState('');
  const [libMuscle, setLibMuscle] = useState('all');
  const [libEquipment, setLibEquipment] = useState('all');
  const [activeDrag, setActiveDrag] = useState<{
    kind: 'library' | 'session';
    label: string;
  } | null>(null);
  const [editing, setEditing] = useState<SessionExercise | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

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

  const equipmentList = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.equipment) set.add(ex.equipment);
    });
    return Array.from(set).sort();
  }, [exercises]);

  const filteredLibrary = useMemo(() => {
    const q = libSearch.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchesMuscle = libMuscle === 'all' || ex.muscle_group === libMuscle;
      const matchesEq = libEquipment === 'all' || ex.equipment === libEquipment;
      const matchesQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscle_group?.toLowerCase().includes(q) ||
        ex.equipment?.toLowerCase().includes(q);
      return matchesMuscle && matchesEq && matchesQuery;
    });
  }, [exercises, libSearch, libMuscle, libEquipment]);

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

  const findSessionForExercise = (exerciseId: string) => {
    for (const [sessionId, list] of Object.entries(sessionExercises)) {
      if (list.some((e) => e.id === exerciseId)) return sessionId;
    }
    return null;
  };

  const handleAddSession = async (weekOverride?: number) => {
    if (!programId || !sessionForm.name.trim()) return;
    setSavingSession(true);
    setError('');
    setSuccess('');

    const created = await workoutSessionsApi.createSession({
      program_id: programId,
      name: sessionForm.name.trim(),
      day_of_week: Number(sessionForm.day_of_week),
      week_number: weekOverride ?? (Number(sessionForm.week_number) || 1),
    });

    setSavingSession(false);

    if (created?.id) {
      setSessionForm({ name: '', day_of_week: '1', week_number: String(weekOverride || 1) });
      setSuccess(`Session "${created.name}" added.`);
      await loadData();
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

  const addExerciseToSession = async (sessionId: string, exercise: Exercise) => {
    if (!exercise.id) return;
    const orderIndex = (sessionExercises[sessionId]?.length || 0) + 1;
    const created = await workoutSessionsApi.addExercise({
      workout_session_id: sessionId,
      exercise_id: exercise.id,
      sets: 3,
      reps: '8-10',
      rest_seconds: 60,
      order_index: orderIndex,
    });
    if (created) {
      await loadSessionExercises(sessionId);
      setSuccess(`Added ${exercise.name}`);
    } else {
      setError('Failed to add exercise.');
    }
  };

  const handleUpdateExercise = async (sessionId: string, exercise: SessionExercise) => {
    if (!exercise.id) return;
    await workoutSessionsApi.updateExercise(exercise);
    await loadSessionExercises(sessionId);
  };

  const handleSwapExercise = async (
    sessionId: string,
    we: SessionExercise,
    newExerciseId: string
  ) => {
    if (!we.id) return;
    await workoutSessionsApi.updateExercise({ ...we, exercise_id: newExerciseId });
    await loadSessionExercises(sessionId);
  };

  const handleDeleteExercise = async (sessionId: string, exerciseId: string) => {
    const ok = await workoutSessionsApi.deleteExercise(exerciseId);
    if (ok) await loadSessionExercises(sessionId);
  };

  const persistOrder = async (sessionId: string, ordered: SessionExercise[]) => {
    setSessionExercises((prev) => ({ ...prev, [sessionId]: ordered }));
    await Promise.all(
      ordered.map((ex, index) =>
        ex.id
          ? workoutSessionsApi.updateExercise({ ...ex, order_index: index + 1 })
          : Promise.resolve()
      )
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'library') {
      setActiveDrag({ kind: 'library', label: (data.exercise as Exercise).name });
    } else if (data?.type === 'session-exercise') {
      setActiveDrag({
        kind: 'session',
        label: (data.exercise as SessionExercise).exercises?.name || 'Exercise',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Library → session drop
    if (activeData?.type === 'library') {
      const exercise = activeData.exercise as Exercise;
      let targetSessionId: string | null = null;
      if (overData?.type === 'session') {
        targetSessionId = overData.sessionId as string;
      } else if (overData?.type === 'session-exercise') {
        targetSessionId = findSessionForExercise(String(over.id));
      } else if (String(over.id).startsWith('session-')) {
        targetSessionId = String(over.id).replace('session-', '');
      }
      if (targetSessionId) await addExerciseToSession(targetSessionId, exercise);
      return;
    }

    // Reorder within session
    if (activeData?.type === 'session-exercise') {
      const fromSession = findSessionForExercise(String(active.id));
      if (!fromSession) return;

      let toSession = fromSession;
      if (overData?.type === 'session') {
        toSession = overData.sessionId as string;
      } else if (overData?.type === 'session-exercise') {
        toSession = findSessionForExercise(String(over.id)) || fromSession;
      }

      if (fromSession === toSession) {
        const list = [...(sessionExercises[fromSession] || [])];
        const oldIndex = list.findIndex((e) => e.id === active.id);
        const newIndex = list.findIndex((e) => e.id === over.id);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        await persistOrder(fromSession, arrayMove(list, oldIndex, newIndex));
      }
    }
  };

  if (!isTrainer) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Trainer access required.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title={program?.name || 'Program Builder'}
        description="Drag exercises from the library into sessions. Edit sets, reps, and rest per exercise."
      >
        <div className="flex flex-wrap items-center gap-2">
          {programId && (
            <GenerateWorkoutDraftButton
              programId={programId}
              defaultGoal={program?.goal || program?.description || ''}
              defaultSessionsPerWeek={program?.sessions_per_week || 3}
              defaultDurationWeeks={program?.duration_weeks || 4}
              onApplied={loadData}
            />
          )}
          <Link href="/trainer/programs">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Programs
            </Button>
          </Link>
        </div>
      </DashboardPageHeader>

      <Suspense fallback={null}>
        <ClientContextStrip />
      </Suspense>

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
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Layers className="h-4 w-4" />
                      Program Overview
                    </CardTitle>
                    {program.description && (
                      <CardDescription className="mt-1">{program.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {program.is_template && <Badge variant="outline">Template</Badge>}
                    {program.difficulty && (
                      <Badge variant="secondary">{program.difficulty}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Add session</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[160px] flex-1 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        placeholder="Upper Body A"
                        value={sessionForm.name}
                        onChange={(e) =>
                          setSessionForm((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Day</Label>
                      <Select
                        value={sessionForm.day_of_week}
                        onValueChange={(v) =>
                          setSessionForm((p) => ({ ...p, day_of_week: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d.value} value={String(d.value)}>
                              {d.short}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Week</Label>
                      <Input
                        type="number"
                        min={1}
                        value={sessionForm.week_number}
                        onChange={(e) =>
                          setSessionForm((p) => ({ ...p, week_number: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      onClick={() => handleAddSession()}
                      disabled={savingSession || !sessionForm.name.trim()}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </CardContent>
                </Card>

                {sessions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add a session, then drag exercises from the right.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  sessionsByWeek.map(({ week, sessions: weekSessions }) => (
                    <div key={week} className="rounded-lg border">
                      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 px-2"
                          onClick={() =>
                            setCollapsedWeeks((prev) => ({
                              ...prev,
                              [week]: !prev[week],
                            }))
                          }
                        >
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              collapsedWeeks[week] && '-rotate-90'
                            )}
                          />
                          <span className="font-semibold">Week {week}</span>
                          <Badge variant="secondary" className="font-normal">
                            {weekSessions.length} sessions
                          </Badge>
                        </Button>
                        <RegenerateWeekButton
                          programId={programId}
                          weekNumber={week}
                          onApplied={loadData}
                        />
                      </div>
                      {!collapsedWeeks[week] && (
                        <div className="space-y-3 p-3">
                          {weekSessions.map((session) => {
                            if (!session.id) return null;
                            const sessionId = session.id;
                            const list = sessionExercises[sessionId] || [];
                            return (
                              <div key={sessionId} className="rounded-md border bg-muted/20 p-3">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">
                                      <Badge variant="outline" className="mr-2 font-normal">
                                        {dayShort(session.day_of_week)}
                                      </Badge>
                                      {session.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {list.length} exercise{list.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteSession(sessionId)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <SortableContext
                                  items={list.map((e) => e.id!).filter(Boolean)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <SessionDropZone
                                    sessionId={sessionId}
                                    isEmpty={list.length === 0}
                                  >
                                    {list.map((we) => (
                                      <SortableExerciseRow
                                        key={we.id}
                                        exercise={we}
                                        swapOptions={
                                          we.exercise_id
                                            ? swapExerciseSuggestion(exercises, we.exercise_id)
                                            : []
                                        }
                                        onEdit={() => {
                                          setEditing(we);
                                          setEditOpen(true);
                                        }}
                                        onDelete={() =>
                                          we.id && handleDeleteExercise(sessionId, we.id)
                                        }
                                        onSwap={(id) => handleSwapExercise(sessionId, we, id)}
                                      />
                                    ))}
                                  </SessionDropZone>
                                </SortableContext>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="lg:sticky lg:top-4 lg:self-start">
                <ExerciseLibraryPane
                  exercises={filteredLibrary}
                  search={libSearch}
                  muscle={libMuscle}
                  equipment={libEquipment}
                  onSearchChange={setLibSearch}
                  onMuscleChange={setLibMuscle}
                  onEquipmentChange={setLibEquipment}
                  muscleGroups={muscleGroups}
                  equipmentList={equipmentList}
                />
              </div>
            </div>

            <DragOverlay>
              {activeDrag ? (
                <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
                  {activeDrag.label}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <ExerciseEditDialog
        exercise={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (updated) => {
          const sessionId = findSessionForExercise(updated.id!);
          if (sessionId) await handleUpdateExercise(sessionId, updated);
        }}
      />
    </div>
  );
}
