'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import {
  nutritionPlansApi,
  planTemplatesApi,
  NutritionPlan,
} from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Utensils, Plus, Trash2, Pencil, Layers, UserPlus } from 'lucide-react';
import Link from 'next/link';

type PlanWithClient = NutritionPlan & { client_name: string };

const emptyForm = {
  name: '',
  daily_calories: '',
  protein_grams: '',
  carbs_grams: '',
  fat_grams: '',
};

function MealPlansContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [templates, setTemplates] = useState<NutritionPlan[]>([]);
  const [clientPlans, setClientPlans] = useState<PlanWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState<NutritionPlan | null>(null);
  const [assignClientId, setAssignClientId] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<NutritionPlan | null>(null);
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

      const templateList = await planTemplatesApi.getTrainerNutritionTemplates(user.id);
      setTemplates(templateList);

      const results = await Promise.all(
        clientList.map(async (client) => {
          const plans = await nutritionPlansApi.getUserNutritionPlans(client.client_id);
          return plans.map((p) => ({ ...p, client_name: client.client_name }));
        })
      );
      setClientPlans(
        results.flat().sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to load meal plans. Please try again.');
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

  const openEditTemplateDialog = (template: NutritionPlan) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      daily_calories: template.daily_calories?.toString() || '',
      protein_grams: template.protein_grams?.toString() || '',
      carbs_grams: template.carbs_grams?.toString() || '',
      fat_grams: template.fat_grams?.toString() || '',
    });
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!user?.id || !form.name.trim()) return;
    setSaving(true);
    setError('');

    const payload: NutritionPlan = {
      id: editingTemplate?.id,
      user_id: user.id,
      name: form.name.trim(),
      daily_calories: form.daily_calories ? Number(form.daily_calories) : undefined,
      protein_grams: form.protein_grams ? Number(form.protein_grams) : undefined,
      carbs_grams: form.carbs_grams ? Number(form.carbs_grams) : undefined,
      fat_grams: form.fat_grams ? Number(form.fat_grams) : undefined,
      is_active: true,
      is_template: true,
      created_by_trainer_id: user.id,
    };

    const result = editingTemplate
      ? await nutritionPlansApi.updateNutritionPlan(payload)
      : await nutritionPlansApi.createNutritionPlan(payload);

    setSaving(false);

    if (result) {
      setTemplateDialogOpen(false);
      setSuccess(editingTemplate ? 'Template updated.' : 'Template created. Open the builder to add meals.');
      fetchData();
    } else {
      setError('Failed to save template. Please try again.');
    }
  };

  const openAssignDialog = (template: NutritionPlan) => {
    setAssigningTemplate(template);
    setAssignClientId(preselectClientId || '');
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!assigningTemplate?.id || !assignClientId) return;
    setAssigning(true);
    setError('');

    const result = await planTemplatesApi.assignNutritionToClient(
      assigningTemplate.id,
      assignClientId
    );

    setAssigning(false);

    if (result.status === 'success') {
      setAssignDialogOpen(false);
      setSuccess(`"${assigningTemplate.name}" applied to client.`);
      fetchData();
    } else {
      setError('Failed to apply meal plan to client. Please try again.');
    }
  };

  const handleDeleteTemplate = async (planId: string | undefined) => {
    if (!planId) return;
    if (!confirm('Delete this template? This cannot be undone.')) return;
    const ok = await nutritionPlansApi.deleteNutritionPlan(planId);
    if (ok) fetchData();
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Meal Plans"
        description="Build reusable nutrition templates and apply them to clients"
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
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Meal Plan Template'}</DialogTitle>
              <DialogDescription>
                Set macro targets, then use the builder to add meals for each day.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Lean Bulk 2800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_calories">Daily Calories</Label>
                  <Input
                    id="daily_calories"
                    type="number"
                    value={form.daily_calories}
                    onChange={(e) => setForm((prev) => ({ ...prev, daily_calories: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein_grams">Protein (g)</Label>
                  <Input
                    id="protein_grams"
                    type="number"
                    value={form.protein_grams}
                    onChange={(e) => setForm((prev) => ({ ...prev, protein_grams: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs_grams">Carbs (g)</Label>
                  <Input
                    id="carbs_grams"
                    type="number"
                    value={form.carbs_grams}
                    onChange={(e) => setForm((prev) => ({ ...prev, carbs_grams: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat_grams">Fat (g)</Label>
                  <Input
                    id="fat_grams"
                    type="number"
                    value={form.fat_grams}
                    onChange={(e) => setForm((prev) => ({ ...prev, fat_grams: e.target.value }))}
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
          <TabsTrigger value="applied">Applied to Clients ({clientPlans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No meal plan templates yet</p>
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
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {template.daily_calories && (
                        <Badge variant="outline">{template.daily_calories} kcal</Badge>
                      )}
                      {template.protein_grams && (
                        <Badge variant="outline">P: {template.protein_grams}g</Badge>
                      )}
                      {template.carbs_grams && (
                        <Badge variant="outline">C: {template.carbs_grams}g</Badge>
                      )}
                      {template.fat_grams && (
                        <Badge variant="outline">F: {template.fat_grams}g</Badge>
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
                      <Link href={`/trainer/meal-plans/${template.id}`}>
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
          ) : clientPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No meal plans applied yet. Create a template and apply it to a client.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <CardDescription>{plan.client_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      {plan.daily_calories && (
                        <Badge variant="outline">{plan.daily_calories} kcal</Badge>
                      )}
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
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

export default function TrainerMealPlansPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <MealPlansContent />
    </Suspense>
  );
}
