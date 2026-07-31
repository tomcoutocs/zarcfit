'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { userProfilesApi, hasCompletedIntake } from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ClientIntakeForm,
  IntakeFormValues,
  emptyIntakeForm,
} from '@/components/nutrition/ClientIntakeForm';
import { ClipboardList } from 'lucide-react';

export default function ClientOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<IntakeFormValues>(emptyIntakeForm);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!user?.id) return;
      const profile = await userProfilesApi.getProfile(user.id);
      if (!isMounted) return;

      // Already answered intake — nothing to do here.
      if (hasCompletedIntake(profile)) {
        router.replace('/client');
        return;
      }

      setForm({
        height_cm: profile?.height_cm?.toString() || '',
        weight_kg: profile?.weight_kg?.toString() || '',
        date_of_birth: profile?.date_of_birth || '',
        gender: profile?.gender || '',
        activity_level: profile?.activity_level || '',
        primary_goal: profile?.primary_goal || '',
        dietary_restrictions: profile?.dietary_restrictions || [],
        allergies: profile?.allergies || [],
      });
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id, router]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.weight_kg || !form.activity_level || !form.primary_goal) {
      setError('Please fill in your weight, activity level, and goal — your trainer needs these to plan your nutrition.');
      return;
    }

    setSaving(true);
    setError('');

    const result = await userProfilesApi.updateProfile({
      id: user.id,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: Number(form.weight_kg),
      date_of_birth: form.date_of_birth || undefined,
      gender: form.gender || undefined,
      activity_level: form.activity_level,
      primary_goal: form.primary_goal,
      dietary_restrictions: form.dietary_restrictions,
      allergies: form.allergies,
    });

    setSaving(false);

    if (result) {
      router.push('/client');
    } else {
      setError('Failed to save your answers. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DashboardPageHeader
        title="Tell us about yourself"
        description="A few quick questions so your trainer can build an accurate nutrition plan for you."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              This takes under a minute. Your trainer will see these answers and can update them
              later if anything changes.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ClientIntakeForm value={form} onChange={setForm} idPrefix="onboarding" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => router.push('/client')}>
              Skip for now
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
