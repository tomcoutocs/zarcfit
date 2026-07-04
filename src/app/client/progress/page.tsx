'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { progressTrackingApi, ProgressRecord } from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrendingUp, Plus, Pencil, Trash2, Scale } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  weight_kg: '',
  body_fat_percentage: '',
  waist_cm: '',
  chest_cm: '',
  arms_cm: '',
  legs_cm: '',
  notes: '',
};

export default function ProgressPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProgressRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchRecords = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await progressTrackingApi.getUserProgress(user.id);
      setRecords(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load progress records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openCreateDialog = () => {
    setEditingRecord(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setDialogOpen(true);
  };

  const openEditDialog = (record: ProgressRecord) => {
    setEditingRecord(record);
    setForm({
      date: record.date,
      weight_kg: record.weight_kg?.toString() || '',
      body_fat_percentage: record.body_fat_percentage?.toString() || '',
      waist_cm: record.waist_cm?.toString() || '',
      chest_cm: record.chest_cm?.toString() || '',
      arms_cm: record.arms_cm?.toString() || '',
      legs_cm: record.legs_cm?.toString() || '',
      notes: record.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id || !form.date) return;
    setSaving(true);

    const payload: ProgressRecord = {
      id: editingRecord?.id,
      user_id: user.id,
      date: form.date,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      body_fat_percentage: form.body_fat_percentage ? Number(form.body_fat_percentage) : undefined,
      waist_cm: form.waist_cm ? Number(form.waist_cm) : undefined,
      chest_cm: form.chest_cm ? Number(form.chest_cm) : undefined,
      arms_cm: form.arms_cm ? Number(form.arms_cm) : undefined,
      legs_cm: form.legs_cm ? Number(form.legs_cm) : undefined,
      notes: form.notes.trim() || undefined,
    };

    const result = editingRecord
      ? await progressTrackingApi.updateProgressRecord(payload)
      : await progressTrackingApi.createProgressRecord(payload);

    setSaving(false);

    if (result) {
      setDialogOpen(false);
      fetchRecords();
    } else {
      setError('Failed to save progress record. Please try again.');
    }
  };

  const handleDelete = async (recordId: string | undefined) => {
    if (!recordId) return;
    if (!confirm('Delete this progress entry? This cannot be undone.')) return;
    const success = await progressTrackingApi.deleteProgressRecord(recordId);
    if (success) fetchRecords();
  };

  const chartData = [...records]
    .filter(r => r.weight_kg != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: r.weight_kg,
    }));

  const latest = records[0];
  const previous = records[1];
  const weightChange = latest?.weight_kg != null && previous?.weight_kg != null
    ? Math.round((latest.weight_kg - previous.weight_kg) * 10) / 10
    : null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Progress" description="Track your body measurements over time">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit Entry' : 'Log Progress'}</DialogTitle>
              <DialogDescription>Record your measurements for this date.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    value={form.weight_kg}
                    onChange={(e) => setForm(prev => ({ ...prev, weight_kg: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_fat_percentage">Body Fat (%)</Label>
                  <Input
                    id="body_fat_percentage"
                    type="number"
                    step="0.1"
                    value={form.body_fat_percentage}
                    onChange={(e) => setForm(prev => ({ ...prev, body_fat_percentage: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waist_cm">Waist (cm)</Label>
                  <Input
                    id="waist_cm"
                    type="number"
                    step="0.1"
                    value={form.waist_cm}
                    onChange={(e) => setForm(prev => ({ ...prev, waist_cm: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chest_cm">Chest (cm)</Label>
                  <Input
                    id="chest_cm"
                    type="number"
                    step="0.1"
                    value={form.chest_cm}
                    onChange={(e) => setForm(prev => ({ ...prev, chest_cm: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arms_cm">Arms (cm)</Label>
                  <Input
                    id="arms_cm"
                    type="number"
                    step="0.1"
                    value={form.arms_cm}
                    onChange={(e) => setForm(prev => ({ ...prev, arms_cm: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legs_cm">Legs (cm)</Label>
                  <Input
                    id="legs_cm"
                    type="number"
                    step="0.1"
                    value={form.legs_cm}
                    onChange={(e) => setForm(prev => ({ ...prev, legs_cm: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.date}>
                {saving ? 'Saving...' : 'Save Entry'}
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
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No progress entries logged yet</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Log Your First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Weight</p>
                    <p className="text-2xl font-bold">
                      {latest?.weight_kg != null ? `${latest.weight_kg} kg` : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Change (last entry)</p>
                    <p className="text-2xl font-bold">
                      {weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{records.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
                <CardDescription>Weight over time (kg)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>All logged measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Body Fat</TableHead>
                      <TableHead>Waist</TableHead>
                      <TableHead>Chest</TableHead>
                      <TableHead>Arms</TableHead>
                      <TableHead>Legs</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.weight_kg != null ? `${record.weight_kg} kg` : '—'}</TableCell>
                        <TableCell>{record.body_fat_percentage != null ? `${record.body_fat_percentage}%` : '—'}</TableCell>
                        <TableCell>{record.waist_cm != null ? `${record.waist_cm} cm` : '—'}</TableCell>
                        <TableCell>{record.chest_cm != null ? `${record.chest_cm} cm` : '—'}</TableCell>
                        <TableCell>{record.arms_cm != null ? `${record.arms_cm} cm` : '—'}</TableCell>
                        <TableCell>{record.legs_cm != null ? `${record.legs_cm} cm` : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(record)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
