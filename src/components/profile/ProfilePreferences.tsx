'use client';

import React, { useEffect, useState } from 'react';
import { userProfilesApi, UserProfile } from '@/lib/supabase/dashboard-api';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type ProfilePreferencesProps = {
  userId: string;
};

const DEFAULT_NOTIFICATIONS = {
  email: true,
  push: true,
  workout_reminders: true,
  message_alerts: true,
};

const DEFAULT_PRIVACY = {
  share_progress_with_trainer: true,
  show_in_leaderboards: false,
};

export function ProfilePreferences({ userId }: ProfilePreferencesProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await userProfilesApi.getProfile(userId);
      setProfile(data);
      if (data) {
        setNotifications({ ...DEFAULT_NOTIFICATIONS, ...data.notification_preferences });
        setPrivacy({ ...DEFAULT_PRIVACY, ...data.privacy_settings });
        setWeightUnit(data.unit_preferences?.weight || 'kg');
        setHeightUnit(data.unit_preferences?.height || 'cm');
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const result = await userProfilesApi.updateProfile({
      ...profile,
      notification_preferences: notifications,
      privacy_settings: privacy,
      unit_preferences: {
        ...profile.unit_preferences,
        weight: weightUnit,
        height: heightUnit,
      },
    });

    setSaving(false);

    if (result) {
      setProfile(result);
      toast.success('Preferences saved');
    } else {
      toast.error('Failed to save preferences');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage how and when you receive notifications
        </p>
        <div className="space-y-3">
          {(
            [
              ['email', 'Email notifications'],
              ['push', 'Push notifications'],
              ['workout_reminders', 'Workout reminders'],
              ['message_alerts', 'Message alerts'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor={`notif-${key}`}>{label}</Label>
              <Switch
                id={`notif-${key}`}
                checked={notifications[key]}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-medium mb-2">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Control your data and privacy settings
        </p>
        <div className="space-y-3">
          {(
            [
              ['share_progress_with_trainer', 'Share progress with trainer'],
              ['show_in_leaderboards', 'Show in leaderboards'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor={`privacy-${key}`}>{label}</Label>
              <Switch
                id={`privacy-${key}`}
                checked={privacy[key]}
                onCheckedChange={(checked) =>
                  setPrivacy((prev) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-medium mb-2">Unit Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Weight</Label>
            <Select value={weightUnit} onValueChange={setWeightUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lb">Pounds (lb)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <Select value={heightUnit} onValueChange={setHeightUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                <SelectItem value="ft">Feet & inches (ft)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Coaching is provided through your trainer&apos;s invitation — no separate client subscription required.
        </AlertDescription>
      </Alert>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}
