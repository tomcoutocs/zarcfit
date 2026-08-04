'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { checkInsApi } from '@/lib/supabase/check-ins-api';

const MOOD_LABELS = ['Struggling', 'Low', 'Okay', 'Good', 'Great'];
const ENERGY_LABELS = ['Drained', 'Tired', 'Steady', 'Energized', 'On fire'];
const SLEEP_LABELS = ['Poor', 'Rough', 'Fair', 'Good', 'Excellent'];

function ScaleField({
  label,
  value,
  onChange,
  captions,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  captions: string[];
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium text-primary">{captions[value - 1]}</span>
      </div>
      <Slider
        min={1}
        max={5}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(next[0])}
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    checkInsApi.getTodaysCheckIn(user.id).then((existing) => {
      if (cancelled || !existing) {
        setLoading(false);
        return;
      }
      setMood(existing.mood);
      setEnergy(existing.energy);
      setSleepQuality(existing.sleep_quality);
      setWeightKg(existing.weight_kg?.toString() || '');
      setNotes(existing.notes || '');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);
    const result = await checkInsApi.createCheckIn({
      client_id: user.id,
      check_in_date: new Date().toISOString().split('T')[0],
      mood,
      energy,
      sleep_quality: sleepQuality,
      weight_kg: weightKg ? Number(weightKg) : undefined,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);

    if (result) {
      toast.success('Check-in logged — nice work!');
      router.push('/client');
    } else {
      toast.error('Failed to save check-in');
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
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/client">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Weekly Check-in
          </CardTitle>
          <CardDescription>
            A quick pulse check for your trainer — takes less than a minute.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ScaleField label="Mood" value={mood} onChange={setMood} captions={MOOD_LABELS} />
            <ScaleField label="Energy" value={energy} onChange={setEnergy} captions={ENERGY_LABELS} />
            <ScaleField
              label="Sleep quality"
              value={sleepQuality}
              onChange={setSleepQuality}
              captions={SLEEP_LABELS}
            />

            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (kg) — optional</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 72.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes — optional</Label>
              <Textarea
                id="notes"
                placeholder="Anything you want your trainer to know this week?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/client">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Submit Check-in'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
