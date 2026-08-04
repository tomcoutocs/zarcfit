'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { exercisesApi, type Exercise } from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'];
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Equipment'];

const emptyForm = {
  name: '',
  muscle_group: 'Full Body',
  equipment: 'Bodyweight',
  difficulty: 'beginner' as Exercise['difficulty'],
  video_url: '',
  description: '',
};

export default function CustomExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const list = await exercisesApi.getCustomForTrainer(user.id);
    setExercises(list);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group || 'Full Body',
      equipment: ex.equipment || 'Bodyweight',
      difficulty: ex.difficulty || 'beginner',
      video_url: ex.video_url || '',
      description: ex.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id || !form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing?.id) {
        await exercisesApi.update(editing.id, form);
        toast.success('Exercise updated');
      } else {
        await exercisesApi.create(user.id, form);
        toast.success('Custom exercise added');
      }
      setDialogOpen(false);
      await load();
    } catch {
      toast.error('Could not save exercise — check RLS / custom-exercises.sql applied');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ex: Exercise) => {
    if (!ex.id) return;
    if (!confirm(`Delete “${ex.name}”?`)) return;
    try {
      await exercisesApi.delete(ex.id);
      toast.success('Deleted');
      await load();
    } catch {
      toast.error('Could not delete exercise');
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Custom exercises"
        description="Add private movements with optional form links. They appear in the program builder alongside the shared library."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/trainer/programs" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Programs
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit exercise' : 'New custom exercise'}</DialogTitle>
                <DialogDescription>
                  Only you can see and use this exercise. Optional YouTube (or other) form video URL.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ex-name">Name</Label>
                  <Input
                    id="ex-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Client-specific band pull"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Muscle group</Label>
                    <Select
                      value={form.muscle_group}
                      onValueChange={(v) => setForm((p) => ({ ...p, muscle_group: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment</Label>
                    <Select
                      value={form.equipment}
                      onValueChange={(v) => setForm((p) => ({ ...p, equipment: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT.map((eq) => (
                          <SelectItem key={eq} value={eq}>
                            {eq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, difficulty: v as Exercise['difficulty'] }))
                    }
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="ex-video">Form video URL (optional)</Label>
                  <Input
                    id="ex-video"
                    value={form.video_url}
                    onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ex-desc">Notes (optional)</Label>
                  <Textarea
                    id="ex-desc"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardPageHeader>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : exercises.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No custom exercises yet. Add one to use it in the program builder.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{ex.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[ex.muscle_group, ex.equipment, ex.difficulty].filter(Boolean).join(' · ')}
                </p>
              </div>
              {ex.video_url ? (
                <a
                  href={ex.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  title="Open form video"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  No video
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => openEdit(ex)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ex)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
