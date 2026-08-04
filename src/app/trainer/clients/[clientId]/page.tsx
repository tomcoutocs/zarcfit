'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  clientManagementApi,
  clientNotesApi,
  trainerProfileApi,
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
import { checkInsApi, ClientCheckIn } from '@/lib/supabase/check-ins-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { ClientActivitySummary } from '@/components/trainer/ClientActivitySummary';
import { ClientStatusBadge } from '@/components/trainer/ClientStatusBadge';
import { AdherenceWidget } from '@/components/trainer/AdherenceWidget';
import { AdaptiveProgrammingCard } from '@/components/trainer/AdaptiveProgrammingCard';
import { InvoiceClientDialog, InvoiceableClient } from '@/components/trainer/InvoiceClientDialog';
import { ClientBillingCard } from '@/components/trainer/ClientBillingCard';
import {
  ClientIntakeForm,
  IntakeFormValues,
  emptyIntakeForm,
} from '@/components/nutrition/ClientIntakeForm';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  MessageSquare,
  Calendar,
  Pin,
  Trash2,
  UserPlus,
  Utensils,
  Pencil,
  Plus,
  Send,
  ClipboardList,
} from 'lucide-react';

function intakeFormFromProfile(profile: UserProfile | null): IntakeFormValues {
  if (!profile) return emptyIntakeForm;
  return {
    height_cm: profile.height_cm?.toString() || '',
    weight_kg: profile.weight_kg?.toString() || '',
    date_of_birth: profile.date_of_birth || '',
    gender: profile.gender || '',
    activity_level: profile.activity_level || '',
    primary_goal: profile.primary_goal || '',
    dietary_restrictions: profile.dietary_restrictions || [],
    allergies: profile.allergies || [],
  };
}

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
  const [checkIns, setCheckIns] = useState<ClientCheckIn[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [diaryDaysLogged, setDiaryDaysLogged] = useState(0);
  const [intakeDialogOpen, setIntakeDialogOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState<IntakeFormValues>(emptyIntakeForm);
  const [savingIntake, setSavingIntake] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [connectOnboarded, setConnectOnboarded] = useState(false);
  const [invoiceableClient, setInvoiceableClient] = useState<InvoiceableClient | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchClientData() {
      if (!user?.id || !clientId) return;

      try {
        const [relation, profile, programsData, logsData, nutritionData, progressData, checkInsData, notesData, trainerProfile, rosterClients] =
          await Promise.all([
            clientManagementApi.getClient(user.id, clientId),
            userProfilesApi.getProfile(clientId),
            workoutProgramsApi.getUserPrograms(clientId),
            workoutLogsApi.getUserLogs(clientId, 10),
            nutritionPlansApi.getUserNutritionPlans(clientId),
            progressTrackingApi.getUserProgress(clientId),
            checkInsApi.getCheckIns(clientId, 5),
            clientNotesApi.getNotes(user.id, clientId),
            trainerProfileApi.getProfile(user.id),
            clientManagementApi.getClients(user.id),
          ]);

        setClientRelation(relation);
        setClientProfile(profile);
        setPrograms(programsData);
        setLogs(logsData);
        setNutritionPlans(nutritionData);
        setProgressRecords(progressData);
        setCheckIns(checkInsData);
        setNotes(notesData);
        setConnectOnboarded(Boolean(trainerProfile?.stripe_connect_onboarded));

        const rosterMatch = rosterClients.find((c) => c.client_id === clientId);
        if (rosterMatch) {
          setInvoiceableClient({
            id: rosterMatch.client_id,
            email: rosterMatch.client_email,
            name: rosterMatch.client_name,
          });
        }
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

  const openIntakeDialog = () => {
    setIntakeForm(intakeFormFromProfile(clientProfile));
    setIntakeDialogOpen(true);
  };

  const handleSaveIntake = async () => {
    if (!clientId) return;
    setSavingIntake(true);

    const result = await userProfilesApi.updateProfile({
      id: clientId,
      height_cm: intakeForm.height_cm ? Number(intakeForm.height_cm) : undefined,
      weight_kg: intakeForm.weight_kg ? Number(intakeForm.weight_kg) : undefined,
      date_of_birth: intakeForm.date_of_birth || undefined,
      gender: intakeForm.gender || undefined,
      activity_level: intakeForm.activity_level || undefined,
      primary_goal: intakeForm.primary_goal || undefined,
      dietary_restrictions: intakeForm.dietary_restrictions,
      allergies: intakeForm.allergies,
    });

    setSavingIntake(false);

    if (result) {
      setClientProfile(result);
      setIntakeDialogOpen(false);
      toast.success('Intake answers updated');
    } else {
      toast.error('Failed to update intake answers');
    }
  };

  const handleCreateNutritionPlan = async () => {
    if (!user?.id || !clientId) return;
    setCreatingPlan(true);

    const plan = await nutritionPlansApi.createNutritionPlan({
      user_id: clientId,
      name: `${clientName}'s Nutrition Plan`,
      is_active: true,
      is_template: false,
      plan_type: 'full',
      created_by_trainer_id: user.id,
    });

    setCreatingPlan(false);

    if (plan?.id) {
      router.push(`/trainer/meal-plans/${plan.id}?client=${clientId}`);
    } else {
      toast.error('Failed to create nutrition plan');
    }
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
                  <ClientStatusBadge status={clientRelation.status} />
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
                  {connectOnboarded && invoiceableClient && (
                    <Button variant="outline" className="gap-2" onClick={() => setInvoiceDialogOpen(true)}>
                      <Send className="h-4 w-4" />
                      Invoice Client
                    </Button>
                  )}
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
          {connectOnboarded && <TabsTrigger value="billing">Billing</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ClientActivitySummary
              notes={notes}
              logs={logs}
              diaryDaysLogged={diaryDaysLogged}
            />
            <AdherenceWidget
              clientId={clientId}
              logs={logs}
              onDiaryDaysChange={setDiaryDaysLogged}
            />
          </div>

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

          <AdaptiveProgrammingCard clientId={clientId} programs={programs} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Weekly Check-ins
              </CardTitle>
              <CardDescription>
                Mood, energy, and sleep quality from the client&apos;s last 5 check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No check-ins logged yet
                </p>
              ) : (
                <div className="space-y-2">
                  {checkIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                    >
                      <span className="font-medium">
                        {new Date(checkIn.check_in_date).toLocaleDateString()}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                        <span>Mood {checkIn.mood}/5</span>
                        <span>Energy {checkIn.energy}/5</span>
                        <span>Sleep {checkIn.sleep_quality}/5</span>
                        {checkIn.weight_kg && <span>{checkIn.weight_kg} kg</span>}
                      </div>
                      {checkIn.notes && (
                        <p className="w-full text-xs text-muted-foreground">{checkIn.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle>Workout History</CardTitle>
                  <CardDescription>
                    View and track client workouts
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/trainer/programs?client=${clientId}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <UserPlus className="h-4 w-4" />
                      Assign Program
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="gap-1" onClick={handleMessage}>
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
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

        <TabsContent value="nutrition" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle>Intake Answers</CardTitle>
                  <CardDescription>
                    Used to calculate macro targets — edit if self-reported data looks off
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={openIntakeDialog}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Height</p>
                  <p className="font-medium">{clientProfile.height_cm ? `${clientProfile.height_cm} cm` : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weight</p>
                  <p className="font-medium">{clientProfile.weight_kg ? `${clientProfile.weight_kg} kg` : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {clientProfile.date_of_birth
                      ? new Date(clientProfile.date_of_birth).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sex</p>
                  <p className="font-medium capitalize">{clientProfile.gender || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Activity Level</p>
                  <p className="font-medium capitalize">
                    {clientProfile.activity_level?.replace('_', ' ') || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Primary Goal</p>
                  <p className="font-medium capitalize">{clientProfile.primary_goal || 'Not set'}</p>
                </div>
              </div>
              {((clientProfile.dietary_restrictions?.length ?? 0) > 0 ||
                (clientProfile.allergies?.length ?? 0) > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(clientProfile.dietary_restrictions || []).map((tag) => (
                    <Badge key={`diet-${tag}`} variant="secondary">{tag}</Badge>
                  ))}
                  {(clientProfile.allergies || []).map((tag) => (
                    <Badge key={`allergy-${tag}`} variant="outline" className="border-destructive/40 text-destructive">
                      ⚠ {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {!clientProfile.weight_kg && (
                <p className="mt-4 text-xs text-muted-foreground">
                  This client hasn&apos;t completed onboarding yet — the macro calculator will need weight,
                  activity level, and goal before it can suggest targets.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle>Nutrition Tracking</CardTitle>
                  <CardDescription>
                    Meal plans and nutrition logs
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={handleCreateNutritionPlan}
                    disabled={creatingPlan}
                  >
                    <Plus className="h-4 w-4" />
                    {creatingPlan ? 'Creating...' : 'Create Nutrition Plan'}
                  </Button>
                  <Link href={`/trainer/meal-plans?client=${clientId}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Utensils className="h-4 w-4" />
                      Apply Template
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="gap-1" onClick={handleMessage}>
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {nutritionPlans.length === 0 ? (
                <>
                  <p className="text-center text-muted-foreground py-8">
                    No meal plan assigned
                  </p>
                  <Button className="w-full gap-2" onClick={handleCreateNutritionPlan} disabled={creatingPlan}>
                    <Plus className="h-4 w-4" />
                    {creatingPlan ? 'Creating...' : 'Create Nutrition Plan'}
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  {nutritionPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/trainer/meal-plans/${plan.id}?client=${clientId}`}
                      className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-muted-foreground">
                          {plan.daily_calories ? `${plan.daily_calories} cal/day` : 'No targets set yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {plan.plan_type === 'flexible' ? 'Flexible' : 'Full plan'}
                        </Badge>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
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

        {connectOnboarded && (
          <TabsContent value="billing">
            <ClientBillingCard
              trainerId={user?.id || ''}
              clientId={clientId}
              connectOnboarded={connectOnboarded}
              invoiceableClient={invoiceableClient}
            />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={intakeDialogOpen} onOpenChange={setIntakeDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Intake Answers</DialogTitle>
            <DialogDescription>
              Correct {clientName}&apos;s self-reported details. This feeds the macro calculator.
            </DialogDescription>
          </DialogHeader>
          <ClientIntakeForm value={intakeForm} onChange={setIntakeForm} idPrefix="client-intake" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveIntake} disabled={savingIntake}>
              {savingIntake ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invoiceableClient && (
        <InvoiceClientDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          clients={[invoiceableClient]}
          defaultClientId={invoiceableClient.id}
        />
      )}
    </div>
  );
}
