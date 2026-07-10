'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  clientManagementApi,
  clientNotesApi,
  TrainerClient,
  ClientNote,
} from '@/lib/supabase/trainer-api';
import {
  userProfilesApi,
  UserProfile,
  workoutProgramsApi,
  workoutLogsApi,
  nutritionPlansApi,
  progressTrackingApi,
  WorkoutProgram,
  WorkoutLog,
  NutritionPlan,
  ProgressRecord,
} from '@/lib/supabase/dashboard-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  MessageSquare,
  Calendar,
  Pin,
  Trash2,
} from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clientId = params?.clientId as string;

  const [loading, setLoading] = useState(true);
  const [clientRelation, setClientRelation] = useState<TrainerClient | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    async function fetchClientData() {
      if (!user?.id || !clientId) return;

      try {
        const [relation, profile, programsData, logsData, nutritionData, progressData, notesData] =
          await Promise.all([
            clientManagementApi.getClient(user.id, clientId),
            userProfilesApi.getProfile(clientId),
            workoutProgramsApi.getUserPrograms(clientId),
            workoutLogsApi.getUserLogs(clientId, 10),
            nutritionPlansApi.getUserNutritionPlans(clientId),
            progressTrackingApi.getUserProgress(clientId),
            clientNotesApi.getNotes(user.id, clientId),
          ]);

        setClientRelation(relation);
        setClientProfile(profile);
        setPrograms(programsData);
        setLogs(logsData);
        setNutritionPlans(nutritionData);
        setProgressRecords(progressData);
        setNotes(notesData);
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [user?.id, clientId]);

  const handleMessage = async () => {
    router.push(`/trainer/messages?client=${clientId}`);
  };

  const refreshNotes = useCallback(async () => {
    if (!user?.id) return;
    const data = await clientNotesApi.getNotes(user.id, clientId);
    setNotes(data);
  }, [user?.id, clientId]);

  const handleAddNote = async () => {
    if (!user?.id || !newNote.trim()) return;
    setSavingNote(true);
    const created = await clientNotesApi.createNote({
      trainer_id: user.id,
      client_id: clientId,
      note_type: 'general',
      content: newNote.trim(),
      is_pinned: false,
    });
    setSavingNote(false);
    if (created) {
      setNewNote('');
      refreshNotes();
    }
  };

  const handleTogglePin = async (note: ClientNote) => {
    if (!note.id) return;
    await clientNotesApi.togglePin(note.id, !note.is_pinned);
    refreshNotes();
  };

  const handleDeleteNote = async (noteId: string | undefined) => {
    if (!noteId) return;
    if (!confirm('Delete this note?')) return;
    await clientNotesApi.deleteNote(noteId);
    refreshNotes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clientRelation || !clientProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Link href="/trainer/clients">
          <Button>Back to Clients</Button>
        </Link>
      </div>
    );
  }

  const clientName = clientProfile.first_name && clientProfile.last_name
    ? `${clientProfile.first_name} ${clientProfile.last_name}`
    : 'Client';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/trainer/clients">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      {/* Client Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={clientProfile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {clientName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{clientName}</h1>
                  <Badge className="bg-green-500">
                    {clientRelation.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {clientProfile.bio || 'No bio available'}
                </p>
                <div className="flex gap-2">
                  <Button className="gap-2" onClick={handleMessage}>
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  <Link href={`/trainer/schedule?client=${clientId}`}>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {clientRelation.accepted_at 
                  ? new Date(clientRelation.accepted_at).toLocaleDateString()
                  : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-medium">
                {clientProfile.height_cm ? `${clientProfile.height_cm} cm` : 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="notes">Notes {notes.length > 0 && `(${notes.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Last logged workouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-3">
                    {logs.slice(0, 4).map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">
                          {log.duration_minutes ? `${log.duration_minutes} min` : ''}
                          {log.rating ? ` · Rated ${log.rating}/5` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Assigned Programs
                </CardTitle>
                <CardDescription>
                  Active training programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {programs.length === 0 ? (
                  <>
                    <p className="text-center text-muted-foreground py-8">
                      No programs assigned
                    </p>
                    <Link href={`/trainer/programs?client=${clientId}`}>
                      <Button variant="outline" className="w-full">
                        Assign Program
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2">
                    {programs.map((program) => (
                      <div key={program.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <span className="font-medium">{program.name}</span>
                        <Badge variant={program.is_active ? 'default' : 'secondary'}>
                          {program.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                    <Link href={`/trainer/programs?client=${clientId}`}>
                      <Button variant="outline" className="w-full">
                        Manage Programs
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workouts">
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>
                View and track client workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No workouts logged yet
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
                        {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
                      </div>
                      <div className="text-right text-muted-foreground">
                        {log.duration_minutes && <p>{log.duration_minutes} min</p>}
                        {log.rating && <p>Rated {log.rating}/5</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Tracking</CardTitle>
              <CardDescription>
                Meal plans and nutrition logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionPlans.length === 0 ? (
                <>
                  <p className="text-center text-muted-foreground py-8">
                    No meal plan assigned
                  </p>
                  <Link href={`/trainer/meal-plans?client=${clientId}`}>
                    <Button variant="outline" className="w-full">
                      Assign Meal Plan
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  {nutritionPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-muted-foreground">
                          {plan.daily_calories ? `${plan.daily_calories} cal/day` : ''}
                        </p>
                      </div>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  <Link href={`/trainer/meal-plans?client=${clientId}`}>
                    <Button variant="outline" className="w-full">
                      Manage Meal Plans
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Weight, measurements, and photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No progress data recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {progressRecords.slice(0, 8).map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span>{new Date(record.date).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">
                        {record.weight_kg ? `${record.weight_kg} kg` : ''}
                        {record.body_fat_percentage ? ` · ${record.body_fat_percentage}% BF` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Trainer Notes</CardTitle>
              <CardDescription>
                Private notes about this client — only visible to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this client..."
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                  {savingNote ? 'Saving...' : 'Add Note'}
                </Button>
              </div>

              {notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notes yet
                </p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={note.is_pinned ? 'text-primary' : ''}
                            onClick={() => handleTogglePin(note)}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
