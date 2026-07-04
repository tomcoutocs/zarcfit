'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import { workoutProgramsApi, WorkoutProgram } from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Dumbbell, Plus, Trash2, Pencil, Layers } from 'lucide-react';
import Link from 'next/link';

type ProgramWithClient = WorkoutProgram & { client_name: string };

const emptyForm = {
  client_id: '',
  name: '',
  description: '',
  difficulty: 'beginner' as WorkoutProgram['difficulty'],
  goal: '',
  duration_weeks: '',
  sessions_per_week: '',
  is_active: true,
};

function ProgramsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [programs, setPrograms] = useState<ProgramWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramWithClient | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const clientList = await clientManagementApi.getClients(user.id);
      setClients(clientList);

      const results = await Promise.all(
        clientList.map(async (client) => {
          const clientPrograms = await workoutProgramsApi.getUserPrograms(client.client_id);
          return clientPrograms.map((p) => ({ ...p, client_name: client.client_name }));
        })
      );

      setPrograms(results.flat().sort((a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ));
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

  const openCreateDialog = () => {
    setEditingProgram(null);
    setForm({ ...emptyForm, client_id: preselectClientId || '' });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (preselectClientId && !loading) {
      openCreateDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectClientId, loading]);

  const openEditDialog = (program: ProgramWithClient) => {
    setEditingProgram(program);
    setForm({
      client_id: program.user_id,
      name: program.name,
      description: program.description || '',
      difficulty: program.difficulty || 'beginner',
      goal: program.goal || '',
      duration_weeks: program.duration_weeks?.toString() || '',
      sessions_per_week: program.sessions_per_week?.toString() || '',
      is_active: program.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.client_id || !form.name.trim()) return;
    setSaving(true);

    const payload: WorkoutProgram = {
      id: editingProgram?.id,
      user_id: form.client_id,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      difficulty: form.difficulty,
      goal: form.goal.trim() || undefined,
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : undefined,
      sessions_per_week: form.sessions_per_week ? Number(form.sessions_per_week) : undefined,
      is_active: form.is_active,
    };

    const result = editingProgram
      ? await workoutProgramsApi.updateProgram(payload)
      : await workoutProgramsApi.createProgram(payload);

    setSaving(false);

    if (result) {
      setDialogOpen(false);
      fetchData();
    } else {
      setError('Failed to save program. Please try again.');
    }
  };

  const handleDelete = async (programId: string | undefined) => {
    if (!programId) return;
    if (!confirm('Delete this program? This cannot be undone.')) return;
    const success = await workoutProgramsApi.deleteProgram(programId);
    if (success) fetchData();
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Programs" description="Create and assign training programs to your clients">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              New Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program' : 'New Program'}</DialogTitle>
              <DialogDescription>
                {editingProgram ? 'Update this training program.' : 'Assign a new training program to a client.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(value) => setForm(prev => ({ ...prev, client_id: value }))}
                  disabled={!!editingProgram}
                >
                  <SelectTrigger id="client">
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

              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 8-Week Strength Foundation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(value) => setForm(prev => ({ ...prev, difficulty: value as WorkoutProgram['difficulty'] }))}
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
                    onChange={(e) => setForm(prev => ({ ...prev, goal: e.target.value }))}
                    placeholder="e.g. Strength, fat loss"
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
                    onChange={(e) => setForm(prev => ({ ...prev, duration_weeks: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessions_per_week">Sessions / Week</Label>
                  <Input
                    id="sessions_per_week"
                    type="number"
                    value={form.sessions_per_week}
                    onChange={(e) => setForm(prev => ({ ...prev, sessions_per_week: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.client_id || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save Program'}
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {clients.length === 0
                ? 'Invite a client before creating a program.'
                : 'No programs created yet'}
            </p>
            {clients.length > 0 && (
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program) => (
            <Card key={program.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{program.name}</CardTitle>
                    <CardDescription>{program.client_name}</CardDescription>
                  </div>
                  <Badge variant={program.is_active ? 'default' : 'secondary'}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {program.description && (
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {program.difficulty && <Badge variant="outline">{program.difficulty}</Badge>}
                  {program.duration_weeks && <Badge variant="outline">{program.duration_weeks} weeks</Badge>}
                  {program.sessions_per_week && <Badge variant="outline">{program.sessions_per_week}x/week</Badge>}
                </div>
                <div className="flex justify-end gap-1">
                  <Link href={`/trainer/programs/${program.id}/builder`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Layers className="h-4 w-4" />
                      Builder
                    </Button>
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(program)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(program.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
