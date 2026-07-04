'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { goalsApi, Goal } from '@/lib/supabase/dashboard-api';
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
import { Target, Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  weight: 'Weight',
  strength: 'Strength',
  nutrition: 'Nutrition',
  habits: 'Habits',
  other: 'Other',
};

const emptyForm = {
  title: '',
  description: '',
  category: 'other' as Goal['category'],
  target_value: '',
  current_value: '',
  unit: '',
  target_date: '',
};

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchGoals = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await goalsApi.getUserGoals(user.id);
      setGoals(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const openCreateDialog = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || '',
      category: goal.category || 'other',
      target_value: goal.target_value?.toString() || '',
      current_value: goal.current_value?.toString() || '',
      unit: goal.unit || '',
      target_date: goal.target_date || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id || !form.title.trim()) return;
    setSaving(true);

    const payload: Goal = {
      id: editingGoal?.id,
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      target_value: form.target_value ? Number(form.target_value) : undefined,
      current_value: form.current_value ? Number(form.current_value) : undefined,
      unit: form.unit.trim() || undefined,
      target_date: form.target_date || undefined,
      is_completed: editingGoal?.is_completed ?? false,
    };

    const result = editingGoal
      ? await goalsApi.updateGoal(payload)
      : await goalsApi.createGoal(payload);

    setSaving(false);

    if (result) {
      setDialogOpen(false);
      fetchGoals();
    } else {
      setError('Failed to save goal. Please try again.');
    }
  };

  const handleToggleComplete = async (goal: Goal) => {
    const result = await goalsApi.updateGoal({ ...goal, is_completed: !goal.is_completed });
    if (result) fetchGoals();
  };

  const handleDelete = async (goalId: string | undefined) => {
    if (!goalId) return;
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    const success = await goalsApi.deleteGoal(goalId);
    if (success) fetchGoals();
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  const progressPercent = (goal: Goal) => {
    if (!goal.target_value || goal.target_value === 0) return null;
    const current = goal.current_value ?? 0;
    const pct = Math.min(100, Math.max(0, (current / goal.target_value) * 100));
    return Math.round(pct);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Goals" description="Set targets and track your progress toward them">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update the details of your goal.' : 'Define a new goal to work toward.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Bench press 200 lbs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional details about this goal"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm(prev => ({ ...prev, category: value as Goal['category'] }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm(prev => ({ ...prev, target_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_value">Current</Label>
                  <Input
                    id="current_value"
                    type="number"
                    value={form.current_value}
                    onChange={(e) => setForm(prev => ({ ...prev, current_value: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={form.target_value}
                    onChange={(e) => setForm(prev => ({ ...prev, target_value: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="lbs, km, etc."
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving...' : 'Save Goal'}
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
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You haven&apos;t set any goals yet</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Active Goals ({activeGoals.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => {
                const pct = progressPercent(goal);
                return (
                  <Card key={goal.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <button onClick={() => handleToggleComplete(goal)} className="text-muted-foreground hover:text-primary">
                              <Circle className="h-5 w-5" />
                            </button>
                            {goal.title}
                          </CardTitle>
                          {goal.description && (
                            <CardDescription className="mt-1">{goal.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">{CATEGORY_LABELS[goal.category || 'other']}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pct !== null && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">
                              {goal.current_value ?? 0} / {goal.target_value} {goal.unit}
                            </span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {goal.target_date ? `Due ${new Date(goal.target_date).toLocaleDateString()}` : 'No target date'}
                        </span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(goal)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Completed ({completedGoals.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="opacity-70">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <button onClick={() => handleToggleComplete(goal)} className="text-primary">
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <span className="line-through">{goal.title}</span>
                        </CardTitle>
                        <Badge variant="secondary">{CATEGORY_LABELS[goal.category || 'other']}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
