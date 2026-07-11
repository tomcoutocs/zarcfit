'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import {
  workoutProgramsApi,
  planTemplatesApi,
  WorkoutProgram,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Dumbbell, Plus, Trash2, Pencil, Layers, UserPlus } from 'lucide-react';
import Link from 'next/link';

type ProgramWithClient = WorkoutProgram & { client_name: string };

const emptyForm = {
  name: '',
  description: '',
  difficulty: 'beginner' as WorkoutProgram['difficulty'],
  goal: '',
  duration_weeks: '',
  sessions_per_week: '',
};

function ProgramsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [templates, setTemplates] = useState<WorkoutProgram[]>([]);
  const [clientPrograms, setClientPrograms] = useState<ProgramWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState<WorkoutProgram | null>(null);
  const [assignClientId, setAssignClientId] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutProgram | null>(null);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const clientList = await clientManagementApi.getClients(user.id);
      setClients(clientList);

      const templateList = await planTemplatesApi.getTrainerWorkoutTemplates(user.id);
      setTemplates(templateList);

      const results = await Promise.all(
        clientList.map(async (client) => {
          const programs = await workoutProgramsApi.getUserPrograms(client.client_id);
          return programs.map((p) => ({ ...p, client_name: client.client_name }));
        })
      );
      setClientPrograms(
        results.flat().sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to load programs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (preselectClientId) {
      setAssignClientId(preselectClientId);
    }
  }, [preselectClientId]);

  const openCreateTemplateDialog = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: WorkoutProgram) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      description: template.description || '',
      difficulty: template.difficulty || 'beginner',
      goal: template.goal || '',
      duration_weeks: template.duration_weeks?.toString() || '',
      sessions_per_week: template.sessions_per_week?.toString() || '',
    });
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!user?.id || !form.name.trim()) return;
    setSaving(true);
    setError('');

    const payload: WorkoutProgram = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      difficulty: form.difficulty,
      goal: form.goal.trim() || undefined,
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : undefined,
      sessions_per_week: form.sessions_per_week ? Number(form.sessions_per_week) : undefined,
      is_active: true,
      is_template: true,
      created_by_trainer_id: user.id,
    };

    const result = editingTemplate
      ? await workoutProgramsApi.updateProgram({ ...payload, id: editingTemplate.id })
      : await workoutProgramsApi.createProgram(payload);

    setSaving(false);

    if (result) {
      setTemplateDialogOpen(false);
      setSuccess(editingTemplate ? 'Template updated.' : 'Template created. Open the builder to add workouts.');
      fetchData();
    } else {
      setError('Failed to save template. Please try again.');
    }
  };

  const openAssignDialog = (template: WorkoutProgram) => {
    setAssigningTemplate(template);
    setAssignClientId(preselectClientId || '');
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!assigningTemplate?.id || !assignClientId) return;
    setAssigning(true);
    setError('');

    const result = await planTemplatesApi.assignWorkoutToClient(
      assigningTemplate.id,
      assignClientId
    );

    setAssigning(false);

    if (result.status === 'success') {
      setAssignDialogOpen(false);
      setSuccess(`"${assigningTemplate.name}" applied to client.`);
      fetchData();
    } else {
      setError('Failed to apply program to client. Please try again.');
    }
  };

  const handleDeleteTemplate = async (programId: string | undefined) => {
    if (!programId) return;
    if (!confirm('Delete this template? This cannot be undone.')) return;
    const ok = await workoutProgramsApi.deleteProgram(programId);
    if (ok) fetchData();
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Workout Plans"
        description="Build reusable templates and apply them to clients"
      >
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateTemplateDialog}>
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Workout Template'}</DialogTitle>
              <DialogDescription>
                Create a reusable plan, then use the builder to add sessions and exercises.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 8-Week Strength Foundation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, difficulty: value as WorkoutProgram['difficulty'] }))
                    }
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Goal</Label>
                  <Input
                    id="goal"
                    value={form.goal}
                    onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_weeks">Duration (weeks)</Label>
                  <Input
                    id="duration_weeks"
                    type="number"
                    value={form.duration_weeks}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration_weeks: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessions_per_week">Sessions / Week</Label>
                  <Input
                    id="sessions_per_week"
                    type="number"
                    value={form.sessions_per_week}
                    onChange={(e) => setForm((prev) => ({ ...prev, sessions_per_week: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save Template'}
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
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">My Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="applied">Applied to Clients ({clientPrograms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No workout templates yet</p>
                <Button onClick={openCreateTemplateDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>Reusable template</CardDescription>
                      </div>
                      <Badge variant="outline">Template</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {template.difficulty && <Badge variant="outline">{template.difficulty}</Badge>}
                      {template.duration_weeks && (
                        <Badge variant="outline">{template.duration_weeks} weeks</Badge>
                      )}
                      {template.sessions_per_week && (
                        <Badge variant="outline">{template.sessions_per_week}x/week</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1"
                        disabled={clients.length === 0}
                        onClick={() => openAssignDialog(template)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Apply to Client
                      </Button>
                      <Link href={`/trainer/programs/${template.id}/builder`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Layers className="h-4 w-4" />
                          Builder
                        </Button>
                      </Link>
                      <Button size="icon" variant="ghost" onClick={() => openEditTemplateDialog(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : clientPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No programs applied yet. Create a template and apply it to a client.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientPrograms.map((program) => (
                <Card key={program.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{program.name}</CardTitle>
                    <CardDescription>{program.client_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/trainer/programs/${program.id}/builder`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Layers className="h-4 w-4" />
                        View Builder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Client</DialogTitle>
            <DialogDescription>
              Copy &quot;{assigningTemplate?.name}&quot; to a client&apos;s profile. They&apos;ll be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={assignClientId} onValueChange={setAssignClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning || !assignClientId}>
              {assigning ? 'Applying...' : 'Apply Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TrainerProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <ProgramsContent />
    </Suspense>
  );
}
