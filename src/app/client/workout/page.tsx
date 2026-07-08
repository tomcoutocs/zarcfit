'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  workoutLogsApi,
  exercisesApi,
  exerciseLogsApi,
  workoutProgramsApi,
  workoutSessionsApi,
  WorkoutLog,
  Exercise,
  ExerciseLog,
  WorkoutProgram,
  WorkoutSession,
  WorkoutExercise,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dumbbell,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  Pencil,
  Clock,
  ClipboardList,
  Play,
} from 'lucide-react';

const emptyLogForm = {
  date: new Date().toISOString().split('T')[0],
  duration_minutes: '',
  notes: '',
  rating: '',
};

const emptyEntryForm = {
  exercise_id: '',
  sets_completed: '',
  reps_completed: '',
  weight_used: '',
  notes: '',
};

export default function WorkoutPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [entriesByLog, setEntriesByLog] = useState<Record<string, ExerciseLog[]>>({});
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [logForm, setLogForm] = useState(emptyLogForm);
  const [savingLog, setSavingLog] = useState(false);
  const [startingSession, setStartingSession] = useState<string | null>(null);

  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [savingEntry, setSavingEntry] = useState(false);

  // "My Programs" state
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [sessionsByProgram, setSessionsByProgram] = useState<Record<string, WorkoutSession[]>>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [exercisesBySession, setExercisesBySession] = useState<Record<string, (WorkoutExercise & { exercises?: Exercise })[]>>({});

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

  const fetchPrograms = useCallback(async () => {
    if (!user?.id) return;
    setProgramsLoading(true);
    try {
      const data = await workoutProgramsApi.getUserPrograms(user.id);
      setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProgramsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLogs();
    fetchPrograms();
    exercisesApi.getAll().then(setExercises);
  }, [fetchLogs, fetchPrograms]);

  const openCreateLogDialog = () => {
    setEditingLog(null);
    setLogForm(emptyLogForm);
    setLogDialogOpen(true);
  };

  const openEditLogDialog = (log: WorkoutLog) => {
    setEditingLog(log);
    setLogForm({
      date: log.date,
      duration_minutes: log.duration_minutes?.toString() || '',
      notes: log.notes || '',
      rating: log.rating?.toString() || '',
    });
    setLogDialogOpen(true);
  };

  const handleSaveLog = async () => {
    if (!user?.id) return;
    setSavingLog(true);
    setError('');

    const payload: WorkoutLog = {
      id: editingLog?.id,
      user_id: user.id,
      workout_session_id: editingLog?.workout_session_id,
      date: logForm.date,
      duration_minutes: logForm.duration_minutes ? Number(logForm.duration_minutes) : undefined,
      notes: logForm.notes.trim() || undefined,
      rating: logForm.rating ? Number(logForm.rating) : undefined,
    };

    try {
      const result = editingLog
        ? await workoutLogsApi.updateLog(payload)
        : await workoutLogsApi.createLog(payload);

      if (result) {
        setLogDialogOpen(false);
        setEditingLog(null);
        await fetchLogs();
        if (result.id) setExpandedLogId(result.id);
      } else {
        setError('Failed to save workout log. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout log. Please try again.');
    } finally {
      setSavingLog(false);
    }
  };

  const handleStartFromSession = async (session: WorkoutSession) => {
    if (!user?.id || !session.id) return;
    setStartingSession(session.id);
    setError('');

    const detail = await workoutSessionsApi.getSessionWithExercises(session.id);
    const log = await workoutLogsApi.createLog({
      user_id: user.id,
      workout_session_id: session.id,
      date: new Date().toISOString().split('T')[0],
      notes: `Started from: ${session.name}`,
    });

    if (log?.id && detail?.exercises) {
      for (const we of detail.exercises) {
        await exerciseLogsApi.createLog({
          workout_log_id: log.id,
          exercise_id: we.exercise_id,
          sets_completed: we.sets,
          reps_completed: we.reps,
        });
      }
      setExpandedLogId(log.id);
      const entries = await exerciseLogsApi.getLogsForWorkout(log.id);
      setEntriesByLog(prev => ({ ...prev, [log.id as string]: entries }));
    }

    setStartingSession(null);
    if (log) {
      await fetchLogs();
    } else {
      setError('Failed to start workout from program.');
    }
  };

  const handleUpdateEntry = async (logId: string, entry: ExerciseLog) => {
    const result = await exerciseLogsApi.updateLog(entry);
    if (result) {
      const entries = await exerciseLogsApi.getLogsForWorkout(logId);
      setEntriesByLog(prev => ({ ...prev, [logId]: entries }));
    }
  };

  const handleDeleteLog = async (logId: string | undefined) => {
    if (!logId) return;
    if (!confirm('Delete this workout log and all its logged exercises? This cannot be undone.')) return;
    const success = await workoutLogsApi.deleteLog(logId);
    if (success) {
      fetchLogs();
      if (expandedLogId === logId) setExpandedLogId(null);
    }
  };

  const toggleExpand = async (logId: string | undefined) => {
    if (!logId) return;
    if (expandedLogId === logId) {
      setExpandedLogId(null);
      return;
    }
    setExpandedLogId(logId);
    if (!entriesByLog[logId]) {
      const entries = await exerciseLogsApi.getLogsForWorkout(logId);
      setEntriesByLog(prev => ({ ...prev, [logId]: entries }));
    }
  };

  const handleAddEntry = async (logId: string) => {
    if (!entryForm.exercise_id) return;
    setSavingEntry(true);

    const payload: ExerciseLog = {
      workout_log_id: logId,
      exercise_id: entryForm.exercise_id,
      sets_completed: entryForm.sets_completed ? Number(entryForm.sets_completed) : undefined,
      reps_completed: entryForm.reps_completed.trim() || undefined,
      weight_used: entryForm.weight_used.trim() || undefined,
      notes: entryForm.notes.trim() || undefined,
    };

    const result = await exerciseLogsApi.createLog(payload);
    setSavingEntry(false);

    if (result) {
      setEntryForm(emptyEntryForm);
      const entries = await exerciseLogsApi.getLogsForWorkout(logId);
      setEntriesByLog(prev => ({ ...prev, [logId]: entries }));
    }
  };

  const handleDeleteEntry = async (logId: string, entryId: string | undefined) => {
    if (!entryId) return;
    const success = await exerciseLogsApi.deleteLog(entryId);
    if (success) {
      const entries = await exerciseLogsApi.getLogsForWorkout(logId);
      setEntriesByLog(prev => ({ ...prev, [logId]: entries }));
    }
  };

  const exerciseName = (exerciseId?: string) => exercises.find(e => e.id === exerciseId)?.name || 'Unknown exercise';

  const toggleExpandProgram = async (programId: string | undefined) => {
    if (!programId) return;
    if (expandedProgramId === programId) {
      setExpandedProgramId(null);
      return;
    }
    setExpandedProgramId(programId);
    if (!sessionsByProgram[programId]) {
      const sessions = await workoutProgramsApi.getProgramSessions(programId);
      setSessionsByProgram(prev => ({ ...prev, [programId]: sessions }));
    }
  };

  const toggleExpandSession = async (sessionId: string | undefined) => {
    if (!sessionId) return;
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (!exercisesBySession[sessionId]) {
      const detail = await workoutSessionsApi.getSessionWithExercises(sessionId);
      setExercisesBySession(prev => ({ ...prev, [sessionId]: detail?.exercises || [] }));
    }
  };

  const dayName = (day?: number) => {
    const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return day ? names[day] || `Day ${day}` : 'Unscheduled';
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader title="Workout Tracking" description="Log your exercises, sets, and progress">
        <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-primary" onClick={openCreateLogDialog}>
              <Plus className="h-4 w-4" />
              <span>Log Workout</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLog ? 'Edit Workout' : 'Log a Workout'}</DialogTitle>
              <DialogDescription>Record a workout session, then add exercises to it below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={logForm.duration_minutes}
                    onChange={(e) => setLogForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">How did it feel? (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  value={logForm.rating}
                  onChange={(e) => setLogForm(prev => ({ ...prev, rating: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={logForm.notes}
                  onChange={(e) => setLogForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes about the workout"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveLog} disabled={savingLog}>
                {savingLog ? 'Saving...' : editingLog ? 'Save Changes' : 'Save & Add Exercises'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 mb-8">
          <TabsTrigger value="logs">Workout Logs</TabsTrigger>
          <TabsTrigger value="programs">My Programs</TabsTrigger>
        </TabsList>

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
                <Button onClick={openCreateLogDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Log Your First Workout
                </Button>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const entries = log.id ? entriesByLog[log.id] || [] : [];
              return (
                <Card key={log.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </CardTitle>
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
                        <Button variant="outline" size="sm" onClick={() => toggleExpand(log.id)} className="gap-1">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {isExpanded ? 'Hide' : 'View'} Exercises
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEditLogDialog(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteLog(log.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {log.notes && <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>}
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-4 border-t pt-4">
                      {entries.length > 0 && (
                        <div className="space-y-2">
                          {entries.map((entry) => (
                            <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border rounded-lg p-3">
                              <div className="font-medium text-sm flex-1">{exerciseName(entry.exercise_id)}</div>
                              <Input
                                className="w-16 h-8"
                                type="number"
                                placeholder="Sets"
                                defaultValue={entry.sets_completed ?? ''}
                                onBlur={(e) => handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  sets_completed: e.target.value ? Number(e.target.value) : undefined,
                                })}
                              />
                              <Input
                                className="w-24 h-8"
                                placeholder="Reps"
                                defaultValue={entry.reps_completed ?? ''}
                                onBlur={(e) => handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  reps_completed: e.target.value || undefined,
                                })}
                              />
                              <Input
                                className="w-24 h-8"
                                placeholder="Weight"
                                defaultValue={entry.weight_used ?? ''}
                                onBlur={(e) => handleUpdateEntry(log.id as string, {
                                  ...entry,
                                  weight_used: e.target.value || undefined,
                                })}
                              />
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteEntry(log.id as string, entry.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                        <div className="text-sm font-medium">Add Exercise</div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                          <div className="md:col-span-2">
                            <Select
                              value={entryForm.exercise_id}
                              onValueChange={(value) => setEntryForm(prev => ({ ...prev, exercise_id: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select exercise" />
                              </SelectTrigger>
                              <SelectContent>
                                {exercises.map((ex) => (
                                  <SelectItem key={ex.id} value={ex.id as string}>{ex.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            placeholder="Sets"
                            type="number"
                            value={entryForm.sets_completed}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, sets_completed: e.target.value }))}
                          />
                          <Input
                            placeholder="Reps (e.g. 8-10)"
                            value={entryForm.reps_completed}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, reps_completed: e.target.value }))}
                          />
                          <Input
                            placeholder="Weight (e.g. 135lb)"
                            value={entryForm.weight_used}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, weight_used: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Notes (optional)"
                            value={entryForm.notes}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                          <Button
                            onClick={() => handleAddEntry(log.id as string)}
                            disabled={savingEntry || !entryForm.exercise_id}
                          >
                            {savingEntry ? 'Adding...' : 'Add'}
                          </Button>
                        </div>
                      </div>
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
                <p className="text-sm text-muted-foreground mt-1">Your trainer can build you a program from their dashboard</p>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => {
              const isExpanded = expandedProgramId === program.id;
              const sessions = program.id ? sessionsByProgram[program.id] || [] : [];
              return (
                <Card key={program.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{program.name}</CardTitle>
                        {program.description && <CardDescription className="mt-1">{program.description}</CardDescription>}
                        <div className="flex items-center gap-2 mt-2">
                          {program.difficulty && <Badge variant="secondary">{program.difficulty}</Badge>}
                          {program.is_active && <Badge>Active</Badge>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toggleExpandProgram(program.id)} className="gap-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {isExpanded ? 'Hide' : 'View'} Sessions
                      </Button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-3 border-t pt-4">
                      {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sessions have been added to this program yet.</p>
                      ) : (
                        sessions.map((session) => {
                          const sessionExpanded = expandedSessionId === session.id;
                          const sessionExercises = session.id ? exercisesBySession[session.id] || [] : [];
                          return (
                            <div key={session.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{session.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {dayName(session.day_of_week)}
                                    {session.week_number ? ` • Week ${session.week_number}` : ''}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => toggleExpandSession(session.id)}>
                                  {sessionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  disabled={startingSession === session.id}
                                  onClick={() => handleStartFromSession(session)}
                                >
                                  <Play className="h-3 w-3" />
                                  {startingSession === session.id ? 'Starting...' : 'Start'}
                                </Button>
                              </div>
                              {sessionExpanded && (
                                <div className="mt-3 space-y-2">
                                  {sessionExercises.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No exercises added to this session yet.</p>
                                  ) : (
                                    sessionExercises.map((we) => (
                                      <div key={we.id} className="text-sm flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                                        <span>{we.exercises?.name || 'Exercise'}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {we.sets ? `${we.sets} sets` : ''}{we.reps ? ` × ${we.reps} reps` : ''}
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
      </Tabs>
    </div>
  );
}
