'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  workoutLogsApi,
  exerciseLogsApi,
  exercisesApi,
  workoutProgramsApi,
  workoutSessionsApi,
  programAssignmentsApi,
  WorkoutLog,
  Exercise,
  ExerciseLog,
  WorkoutProgram,
  WorkoutSession,
  WorkoutExercise,
  ProgramAssignment,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dumbbell,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  ClipboardList,
  CheckCircle2,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { WorkoutAnalytics } from '@/components/workout/WorkoutAnalytics';

const DAYS: { value: number; short: string; full: string }[] = [
  { value: 1, short: 'Mon', full: 'Monday' },
  { value: 2, short: 'Tue', full: 'Tuesday' },
  { value: 3, short: 'Wed', full: 'Wednesday' },
  { value: 4, short: 'Thu', full: 'Thursday' },
  { value: 5, short: 'Fri', full: 'Friday' },
  { value: 6, short: 'Sat', full: 'Saturday' },
  { value: 7, short: 'Sun', full: 'Sunday' },
];

type SessionExercise = WorkoutExercise & { exercises?: Exercise };

type ExerciseDraft = {
  exercise_id: string;
  sets_completed: string;
  reps_completed: string;
  weight_used: string;
  difficulty_rating: string;
  notes: string;
};

function programDayFromDate(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  const jsDay = d.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function emptyDraft(prescribed?: SessionExercise): ExerciseDraft {
  return {
    exercise_id: prescribed?.exercise_id || '',
    sets_completed: prescribed?.sets?.toString() || '',
    reps_completed: prescribed?.reps || '',
    weight_used: '',
    difficulty_rating: '',
    notes: '',
  };
}

export default function WorkoutPage() {
  const { user } = useAuth();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [entriesByLog, setEntriesByLog] = useState<Record<string, ExerciseLog[]>>({});
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('today');

  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercisesBySession, setExercisesBySession] = useState<Record<string, SessionExercise[]>>({});
  const [programsLoading, setProgramsLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState(() =>
    programDayFromDate(new Date().toISOString().split('T')[0])
  );
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exerciseDrafts, setExerciseDrafts] = useState<Record<string, ExerciseDraft>>({});
  const [savingWorkout, setSavingWorkout] = useState(false);

  const [exerciseNameById, setExerciseNameById] = useState<Record<string, string>>({});
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [sessionsByProgram, setSessionsByProgram] = useState<Record<string, WorkoutSession[]>>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [programExercisesBySession, setProgramExercisesBySession] = useState<
    Record<string, SessionExercise[]>
  >({});

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await workoutLogsApi.getUserLogs(user.id, 50);
      setLogs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load workout logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSessionsForProgram = useCallback(async (programId: string) => {
    const programSessions = await workoutProgramsApi.getProgramSessions(programId);
    setSessions(programSessions);

    const exerciseMap: Record<string, SessionExercise[]> = {};
    await Promise.all(
      programSessions.map(async (session) => {
        if (!session.id) return;
        const detail = await workoutSessionsApi.getSessionWithExercises(session.id);
        exerciseMap[session.id] = detail?.exercises || [];
      })
    );
    setExercisesBySession(exerciseMap);
  }, []);

  const loadProgramData = useCallback(async () => {
    if (!user?.id) return;
    setProgramsLoading(true);
    try {
      const [data, assignmentList] = await Promise.all([
        workoutProgramsApi.getUserPrograms(user.id),
        programAssignmentsApi.getClientAssignments(user.id),
      ]);
      setPrograms(data);
      setAssignments(assignmentList);

      setSelectedProgramId((prev) => {
        if (prev && data.some((program) => program.id === prev)) return prev;
        return data.find((program) => program.is_active)?.id || data[0]?.id || null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProgramsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!selectedProgramId) {
      setActiveProgram(null);
      setSessions([]);
      setExercisesBySession({});
      return;
    }

    const program = programs.find((item) => item.id === selectedProgramId) || null;
    setActiveProgram(program);

    let cancelled = false;
    (async () => {
      setProgramsLoading(true);
      try {
        await loadSessionsForProgram(selectedProgramId);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setProgramsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProgramId, programs, loadSessionsForProgram]);

  useEffect(() => {
    fetchLogs();
    loadProgramData();
  }, [fetchLogs, loadProgramData]);

  useEffect(() => {
    exercisesApi.getAll().then((list) => {
      const map: Record<string, string> = {};
      list.forEach((e) => {
        if (e.id) map[e.id] = e.name;
      });
      setExerciseNameById(map);
    });
  }, []);

  useEffect(() => {
    setSelectedDay(programDayFromDate(logDate));
  }, [logDate]);

  const daySessions = useMemo(
    () => sessions.filter((s) => s.day_of_week === selectedDay),
    [sessions, selectedDay]
  );

  const draftKey = (sessionId: string, workoutExerciseId: string) =>
    `${sessionId}:${workoutExerciseId}`;

  useEffect(() => {
    const drafts: Record<string, ExerciseDraft> = {};
    for (const session of daySessions) {
      if (!session.id) continue;
      const exercises = exercisesBySession[session.id] || [];
      for (const exercise of exercises) {
        if (!exercise.id) continue;
        drafts[draftKey(session.id, exercise.id)] = emptyDraft(exercise);
      }
    }
    setExerciseDrafts(drafts);
  }, [daySessions, exercisesBySession]);

  const updateDraft = (key: string, field: keyof ExerciseDraft, value: string) => {
    setExerciseDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleLogTodaysWorkout = async (session: WorkoutSession) => {
    if (!user?.id || !session.id) return;
    setSavingWorkout(true);
    setError('');
    setSuccess('');

    const sessionExercises = exercisesBySession[session.id] || [];
    const draftsToSave = sessionExercises
      .filter((ex) => ex.id && exerciseDrafts[draftKey(session.id!, ex.id)])
      .map((ex) => ({
        exercise: ex,
        draft: exerciseDrafts[draftKey(session.id!, ex.id!)],
      }))
      .filter(
        ({ draft }) =>
          draft.sets_completed ||
          draft.reps_completed ||
          draft.weight_used ||
          draft.difficulty_rating
      );

    if (draftsToSave.length === 0) {
      setError('Log at least one exercise with sets, reps, weight, or difficulty.');
      setSavingWorkout(false);
      return;
    }

    try {
      const log = await workoutLogsApi.createLog({
        user_id: user.id,
        workout_session_id: session.id,
        date: logDate,
        duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        notes: workoutNotes.trim() || `Completed: ${session.name}`,
      });

      if (!log?.id) {
        setError('Failed to save workout. Please try again.');
        return;
      }

      for (const { exercise, draft } of draftsToSave) {
        await exerciseLogsApi.createLog({
          workout_log_id: log.id,
          exercise_id: exercise.exercise_id,
          sets_completed: draft.sets_completed ? Number(draft.sets_completed) : undefined,
          reps_completed: draft.reps_completed.trim() || undefined,
          weight_used: draft.weight_used.trim() || undefined,
          difficulty_rating: draft.difficulty_rating ? Number(draft.difficulty_rating) : undefined,
          notes: draft.notes.trim() || undefined,
        });
      }

      setSuccess(`${session.name} logged successfully.`);
      setDurationMinutes('');
      setWorkoutNotes('');
      setActiveTab('logs');
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout.');
    } finally {
      setSavingWorkout(false);
    }
  };

  const handleUpdateEntry = async (logId: string, entry: ExerciseLog) => {
    const result = await exerciseLogsApi.updateLog(entry);
    if (result) {
      const entries = await exerciseLogsApi.getLogsForWorkout(logId);
      setEntriesByLog((prev) => ({ ...prev, [logId]: entries }));
    }
  };

  const handleDeleteLog = async (logId: string | undefined) => {
    if (!logId) return;
    if (!confirm('Delete this workout log and all its logged exercises? This cannot be undone.'))
      return;
    const ok = await workoutLogsApi.deleteLog(logId);
    if (ok) {
      fetchLogs();
      if (expandedLogId === logId) setExpandedLogId(null);
    }
  };

  const toggleExpandLog = async (logId: string | undefined) => {
    if (!logId) return;
    if (expandedLogId === logId) {
      setExpandedLogId(null);
      return;
    }
    setExpandedLogId(logId);
    if (!entriesByLog[logId]) {
      const entries = await exerciseLogsApi.getLogsForWorkout(logId);
      setEntriesByLog((prev) => ({ ...prev, [logId]: entries }));
    }
  };

  const sessionNameForLog = (sessionId?: string) => {
    if (!sessionId) return null;
    const session = sessions.find((s) => s.id === sessionId);
    return session?.name || null;
  };

  const exerciseNameFromLog = (exerciseId?: string) => {
    if (!exerciseId) return 'Exercise';
    if (exerciseNameById[exerciseId]) return exerciseNameById[exerciseId];
    for (const sessionExercises of Object.values(exercisesBySession)) {
      const match = sessionExercises.find((e) => e.exercise_id === exerciseId);
      if (match?.exercises?.name) return match.exercises.name;
    }
    return 'Exercise';
  };

  const toggleExpandProgram = async (programId: string | undefined) => {
    if (!programId) return;
    if (expandedProgramId === programId) {
      setExpandedProgramId(null);
      return;
    }
    setExpandedProgramId(programId);
    if (!sessionsByProgram[programId]) {
      const programSessions = await workoutProgramsApi.getProgramSessions(programId);
      setSessionsByProgram((prev) => ({ ...prev, [programId]: programSessions }));
    }
  };

  const toggleExpandSession = async (sessionId: string | undefined) => {
    if (!sessionId) return;
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (!programExercisesBySession[sessionId]) {
      const detail = await workoutSessionsApi.getSessionWithExercises(sessionId);
      setProgramExercisesBySession((prev) => ({
        ...prev,
        [sessionId]: detail?.exercises || [],
      }));
    }
  };

  const dayName = (day?: number) =>
    DAYS.find((d) => d.value === day)?.full || 'Unscheduled';

  const selectedDayLabel = DAYS.find((d) => d.value === selectedDay)?.full || '';

  const assignmentByProgramId = useMemo(() => {
    const map: Record<string, ProgramAssignment> = {};
    assignments.forEach((assignment) => {
      if (assignment.program_id) {
        map[assignment.program_id] = assignment;
      }
    });
    return map;
  }, [assignments]);

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId);
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Workout Tracking"
        description="Log exercises from your trainer's program"
      />

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="today">Today&apos;s Workout</TabsTrigger>
          <TabsTrigger value="logs">History</TabsTrigger>
          <TabsTrigger value="programs">My Program</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {programsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : !activeProgram ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No program has been assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your trainer will assign a workout plan you can log here
                </p>
                <Link href="/client/chat">
                  <Button variant="outline" className="gap-2 mt-4">
                    <MessageSquare className="h-4 w-4" />
                    Message your trainer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {programs.length > 1 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="active_program">Active Program</Label>
                      <Select
                        value={selectedProgramId || undefined}
                        onValueChange={handleProgramSelect}
                      >
                        <SelectTrigger id="active_program">
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id!}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{activeProgram.name}</CardTitle>
                  {activeProgram.description && (
                    <CardDescription>{activeProgram.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="log_date">Workout Date</Label>
                      <Input
                        id="log_date"
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Program Day</Label>
                      <Select
                        value={selectedDay.toString()}
                        onValueChange={(v) => setSelectedDay(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.full}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workout_notes">Workout Notes</Label>
                      <Input
                        id="workout_notes"
                        value={workoutNotes}
                        onChange={(e) => setWorkoutNotes(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {daySessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No workout scheduled for {selectedDayLabel}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pick another day or check My Program for your full schedule
                    </p>
                  </CardContent>
                </Card>
              ) : (
                daySessions.map((session) => {
                  const sessionExercises = session.id
                    ? exercisesBySession[session.id] || []
                    : [];
                  return (
                    <Card key={session.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">{session.name}</CardTitle>
                            <CardDescription>
                              {selectedDayLabel}
                              {session.week_number ? ` · Week ${session.week_number}` : ''}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {sessionExercises.length} exercise
                            {sessionExercises.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {session.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sessionExercises.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No exercises in this session yet.
                          </p>
                        ) : (
                          sessionExercises.map((we) => {
                            if (!session.id || !we.id) return null;
                            const key = draftKey(session.id, we.id);
                            const draft = exerciseDrafts[key] || emptyDraft(we);
                            return (
                              <div key={we.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-medium">
                                      {we.exercises?.name || 'Exercise'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Prescribed:{' '}
                                      {we.sets ? `${we.sets} sets` : '—'}
                                      {we.reps ? ` × ${we.reps} reps` : ''}
                                      {we.rest_seconds ? ` · ${we.rest_seconds}s rest` : ''}
                                    </div>
                                    {we.notes && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {we.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Sets</Label>
                                    <Input
                                      type="number"
                                      value={draft.sets_completed}
                                      onChange={(e) =>
                                        updateDraft(key, 'sets_completed', e.target.value)
                                      }
                                      placeholder={we.sets?.toString() || 'Sets'}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Reps</Label>
                                    <Input
                                      value={draft.reps_completed}
                                      onChange={(e) =>
                                        updateDraft(key, 'reps_completed', e.target.value)
                                      }
                                      placeholder={we.reps || 'Reps'}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Weight</Label>
                                    <Input
                                      value={draft.weight_used}
                                      onChange={(e) =>
                                        updateDraft(key, 'weight_used', e.target.value)
                                      }
                                      placeholder="e.g. 135 lb"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Difficulty (1-5)</Label>
                                    <Select
                                      value={draft.difficulty_rating || undefined}
                                      onValueChange={(v) =>
                                        updateDraft(key, 'difficulty_rating', v)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Rate" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                          <SelectItem key={n} value={n.toString()}>
                                            {n} — {n === 1 ? 'Very easy' : n === 5 ? 'Max effort' : ''}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Input
                                  value={draft.notes}
                                  onChange={(e) => updateDraft(key, 'notes', e.target.value)}
                                  placeholder="Notes (optional)"
                                />
                              </div>
                            );
                          })
                        )}
                        <Button
                          className="w-full gap-2"
                          disabled={savingWorkout || sessionExercises.length === 0}
                          onClick={() => handleLogTodaysWorkout(session)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {savingWorkout ? 'Saving...' : `Log ${session.name}`}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven&apos;t logged any workouts yet</p>
                <p className="text-sm text-muted-foreground">
                  Use Today&apos;s Workout to log exercises from your program
                </p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const entries = log.id ? entriesByLog[log.id] || [] : [];
              const sessionLabel = sessionNameForLog(log.workout_session_id);
              return (
                <Card key={log.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {new Date(log.date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </CardTitle>
                        {sessionLabel && (
                          <CardDescription className="mt-1">{sessionLabel}</CardDescription>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {log.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {log.duration_minutes} min
                            </span>
                          )}
                          {log.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5" />
                              {log.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpandLog(log.id)}
                          className="gap-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          {isExpanded ? 'Hide' : 'View'}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteLog(log.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                    )}
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-3 border-t pt-4">
                      {entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No exercises logged.</p>
                      ) : (
                        entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 border rounded-lg p-3"
                          >
                            <div className="font-medium text-sm flex-1 min-w-[120px]">
                              {exerciseNameFromLog(entry.exercise_id)}
                            </div>
                            <Input
                              className="w-16 h-8"
                              type="number"
                              placeholder="Sets"
                              defaultValue={entry.sets_completed ?? ''}
                              onBlur={(e) =>
                                handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  sets_completed: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                            />
                            <Input
                              className="w-24 h-8"
                              placeholder="Reps"
                              defaultValue={entry.reps_completed ?? ''}
                              onBlur={(e) =>
                                handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  reps_completed: e.target.value || undefined,
                                })
                              }
                            />
                            <Input
                              className="w-28 h-8"
                              placeholder="Weight"
                              defaultValue={entry.weight_used ?? ''}
                              onBlur={(e) =>
                                handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  weight_used: e.target.value || undefined,
                                })
                              }
                            />
                            <Select
                              defaultValue={entry.difficulty_rating?.toString()}
                              onValueChange={(v) =>
                                handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  difficulty_rating: Number(v),
                                })
                              }
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue placeholder="Difficulty" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem key={n} value={n.toString()}>
                                    {n}/5
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          {programsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : programs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No programs have been assigned to you yet</p>
                <Link href="/client/chat">
                  <Button variant="outline" className="gap-2 mt-4">
                    <MessageSquare className="h-4 w-4" />
                    Message your trainer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => {
              const isExpanded = expandedProgramId === program.id;
              const programSessions = program.id ? sessionsByProgram[program.id] || [] : [];
              const assignment = program.id ? assignmentByProgramId[program.id] : undefined;
              return (
                <Card key={program.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{program.name}</CardTitle>
                        {program.description && (
                          <CardDescription className="mt-1">{program.description}</CardDescription>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {program.difficulty && (
                            <Badge variant="secondary">{program.difficulty}</Badge>
                          )}
                          {program.is_active && <Badge>Active</Badge>}
                          {assignment?.start_date && (
                            <Badge variant="outline">
                              Started {new Date(assignment.start_date).toLocaleDateString()}
                            </Badge>
                          )}
                          {assignment?.status && (
                            <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                              {assignment.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpandProgram(program.id)}
                        className="gap-1"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {isExpanded ? 'Hide' : 'View'} Schedule
                      </Button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-3 border-t pt-4">
                      {programSessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sessions in this program.</p>
                      ) : (
                        programSessions.map((session) => {
                          const sessionExpanded = expandedSessionId === session.id;
                          const sessionExercises = session.id
                            ? programExercisesBySession[session.id] || []
                            : [];
                          return (
                            <div key={session.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="font-medium text-sm">{session.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {dayName(session.day_of_week)}
                                    {session.week_number ? ` · Week ${session.week_number}` : ''}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandSession(session.id)}
                                >
                                  {sessionExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {sessionExpanded && (
                                <div className="mt-3 space-y-2">
                                  {sessionExercises.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      No exercises in this session.
                                    </p>
                                  ) : (
                                    sessionExercises.map((we) => (
                                      <div
                                        key={we.id}
                                        className="text-sm flex items-center justify-between bg-muted/30 rounded px-3 py-2"
                                      >
                                        <span>{we.exercises?.name || 'Exercise'}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {we.sets ? `${we.sets} sets` : ''}
                                          {we.reps ? ` × ${we.reps} reps` : ''}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {user?.id ? (
            <WorkoutAnalytics userId={user.id} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Sign in to view workout analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
