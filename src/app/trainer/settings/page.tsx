'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  trainerProfileApi,
  trainerSettingsApi,
  billingApi,
  clientManagementApi,
  TrainerProfile,
  TrainerSettings,
  ClientUsage,
} from '@/lib/supabase/trainer-api';
import { TRAINER_PLANS, getPlanStripePriceId } from '@/lib/trainer-plans';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { InvoiceClientDialog, InvoiceableClient } from '@/components/trainer/InvoiceClientDialog';
import { CreditCard, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push/client';

const emptyProfileForm = {
  business_name: '',
  bio: '',
  phone: '',
  website: '',
  years_experience: '',
  specializations: '',
  certifications: '',
};

const emptySettingsForm = {
  timezone: 'UTC',
  default_session_duration: '60',
  booking_buffer: '30',
  auto_accept_clients: false,
  notification_email: true,
  notification_push: true,
};

function TrainerSettingsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [usage, setUsage] = useState<ClientUsage | null>(null);
  const [connectOnboarded, setConnectOnboarded] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [invoiceClients, setInvoiceClients] = useState<InvoiceableClient[]>([]);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [profile, settings, usageResult, clients] = await Promise.all([
      trainerProfileApi.getProfile(user.id),
      trainerSettingsApi.getSettings(user.id),
      billingApi.getClientUsage(user.id),
      clientManagementApi.getClients(user.id),
    ]);

    if (profile) {
      setProfileForm({
        business_name: profile.business_name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        website: profile.website || '',
        years_experience: profile.years_experience?.toString() || '',
        specializations: (profile.specializations || []).join(', '),
        certifications: (profile.certifications || []).join(', '),
      });
      setAvatarUrl(profile.avatar_url || '');
      setSubscriptionTier(profile.subscription_tier || 'free');
      setSubscriptionStatus(profile.subscription_status || 'active');
      setStripeCustomerId(
        (profile as TrainerProfile & { stripe_customer_id?: string }).stripe_customer_id || null
      );
      setConnectOnboarded(Boolean(profile.stripe_connect_onboarded));
    }

    if (settings) {
      setSettingsForm({
        timezone: settings.timezone || 'UTC',
        default_session_duration: settings.default_session_duration?.toString() || '60',
        booking_buffer: settings.booking_buffer?.toString() || '30',
        auto_accept_clients: settings.auto_accept_clients ?? false,
        notification_email: settings.notification_preferences?.email ?? true,
        notification_push: settings.notification_preferences?.push ?? true,
      });
    }

    setUsage(usageResult);
    setInvoiceClients(
      clients
        .filter((c) => c.status === 'active')
        .map((c) => ({ id: c.client_id, email: c.client_email, name: c.client_name }))
    );

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Land back from Stripe Connect onboarding — re-check status server-side
  // since there's no `account.updated` webhook wired up yet (MVP scope).
  useEffect(() => {
    const connectParam = searchParams.get('connect');
    if (connectParam !== 'return') return;

    (async () => {
      try {
        const res = await fetch('/api/stripe/connect/onboard');
        const data = await res.json();
        setConnectOnboarded(Boolean(data.onboarded));
        toast(data.onboarded ? 'Stripe account connected' : 'Stripe onboarding not finished yet');
      } catch {
        // Non-fatal — trainer can just retry the connect button.
      }
    })();
  }, [searchParams]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    setError('');
    setProfileSuccess('');

    const result = await trainerProfileApi.updateProfile({
      id: user.id,
      business_name: profileForm.business_name.trim() || undefined,
      bio: profileForm.bio.trim() || undefined,
      phone: profileForm.phone.trim() || undefined,
      website: profileForm.website.trim() || undefined,
      years_experience: profileForm.years_experience ? Number(profileForm.years_experience) : undefined,
      specializations: profileForm.specializations
        ? profileForm.specializations.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      certifications: profileForm.certifications
        ? profileForm.certifications.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    } as Partial<TrainerProfile> & { id: string });

    setSavingProfile(false);

    if (result) {
      setProfileSuccess('Business profile updated successfully');
    } else {
      setError('Failed to update business profile. Please try again.');
    }
  };

  const handleAvatarUploaded = async (url: string) => {
    if (!user?.id) return;
    setAvatarUrl(url);
    await trainerProfileApi.updateProfile({ id: user.id, avatar_url: url });
    setProfileSuccess('Profile photo updated');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingSettings(true);
    setError('');
    setSettingsSuccess('');

    const result = await trainerSettingsApi.updateSettings({
      trainer_id: user.id,
      timezone: settingsForm.timezone,
      default_session_duration: Number(settingsForm.default_session_duration) || 60,
      booking_buffer: Number(settingsForm.booking_buffer) || 0,
      auto_accept_clients: settingsForm.auto_accept_clients,
      notification_preferences: {
        email: settingsForm.notification_email,
        push: settingsForm.notification_push,
      },
    } as TrainerSettings);

    setSavingSettings(false);

    if (result) {
      setSettingsSuccess('Booking preferences updated successfully');
      if (settingsForm.notification_email) {
        fetch('/api/trainer/notification-preferences', { method: 'POST' }).catch(() => {});
      }
    } else {
      setError('Failed to update booking preferences. Please try again.');
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user?.email) return;
    const priceId = getPlanStripePriceId(planId);
    if (!priceId) {
      toast.error('Stripe price not configured for this plan');
      return;
    }
    setCheckoutPlanId(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Checkout failed');
    } catch {
      toast.error('Checkout failed');
    } finally {
      setCheckoutPlanId(null);
    }
  };

  // CA-204: toggling push actually (un)subscribes this device, not just the
  // saved preference. Reverts the switch if the browser denies permission.
  const handlePushToggle = async (checked: boolean) => {
    setSettingsForm((prev) => ({ ...prev, notification_push: checked }));

    if (checked) {
      const subscribed = await subscribeToPush();
      if (!subscribed) {
        setSettingsForm((prev) => ({ ...prev, notification_push: false }));
        toast.error('Could not enable push notifications — check your browser permissions');
      }
    } else {
      await unsubscribeFromPush();
    }
  };

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Could not start Stripe onboarding');
    } catch {
      toast.error('Could not start Stripe onboarding');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) {
      toast.error('No billing account found — subscribe first');
      return;
    }
    setBillingLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Could not open billing portal');
    } catch {
      toast.error('Could not open billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DashboardPageHeader title="Settings" description="Manage your business profile and booking preferences" />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>This information may be shown to prospective clients</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileSuccess && (
              <Alert>
                <AlertDescription>{profileSuccess}</AlertDescription>
              </Alert>
            )}

            {user && (
              <div className="flex justify-center pb-2">
                <ImageUpload
                  userId={user.id}
                  folder="avatars"
                  currentUrl={avatarUrl}
                  fallback={(profileForm.business_name || 'TR').substring(0, 2).toUpperCase()}
                  onUploaded={handleAvatarUploaded}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={profileForm.business_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="e.g. Coach Alex Fitness"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={profileForm.years_experience}
                onChange={(e) => setProfileForm(prev => ({ ...prev, years_experience: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specializations">Specializations (comma separated)</Label>
              <Input
                id="specializations"
                value={profileForm.specializations}
                onChange={(e) => setProfileForm(prev => ({ ...prev, specializations: e.target.value }))}
                placeholder="Strength training, Weight loss, Nutrition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications (comma separated)</Label>
              <Input
                id="certifications"
                value={profileForm.certifications}
                onChange={(e) => setProfileForm(prev => ({ ...prev, certifications: e.target.value }))}
                placeholder="NASM-CPT, CSCS"
              />
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Business Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Preferences</CardTitle>
          <CardDescription>Control how sessions are scheduled with clients</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsSuccess && (
              <Alert>
                <AlertDescription>{settingsSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_session_duration">Default Session Duration (min)</Label>
                <Input
                  id="default_session_duration"
                  type="number"
                  value={settingsForm.default_session_duration}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, default_session_duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking_buffer">Booking Buffer (min)</Label>
                <Input
                  id="booking_buffer"
                  type="number"
                  value={settingsForm.booking_buffer}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, booking_buffer: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={settingsForm.timezone}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, timezone: e.target.value }))}
                placeholder="e.g. America/New_York"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Auto-accept new clients</p>
                <p className="text-sm text-muted-foreground">Skip manual approval for invitation acceptances</p>
              </div>
              <Switch
                checked={settingsForm.auto_accept_clients}
                onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, auto_accept_clients: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-muted-foreground">Get emailed about new messages and bookings</p>
              </div>
              <Switch
                checked={settingsForm.notification_email}
                onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, notification_email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Push notifications</p>
                <p className="text-sm text-muted-foreground">Get notified in-app about new activity</p>
              </div>
              <Switch
                checked={settingsForm.notification_push}
                onCheckedChange={handlePushToggle}
              />
            </div>

            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your trainer subscription and client limit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {subscriptionTier} plan
            </Badge>
            <Badge variant={subscriptionStatus === 'active' ? 'default' : 'outline'} className="capitalize">
              {subscriptionStatus}
            </Badge>
          </div>

          {/* PF-313: usage meter */}
          {usage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {usage.activeCount} of {usage.limit} clients
                </span>
                <span className="text-muted-foreground">
                  {usage.pausedCount > 0 && `${usage.pausedCount} paused`}
                  {usage.pausedCount > 0 && usage.pendingInvitationCount > 0 && ' · '}
                  {usage.pendingInvitationCount > 0 &&
                    `${usage.pendingInvitationCount} pending invite${usage.pendingInvitationCount === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${usage.atCap ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (usage.usageForLimit / Math.max(usage.limit, 1)) * 100)}%` }}
                />
              </div>
              {usage.atCap && (
                <p className="text-sm text-destructive">
                  You&apos;re at your plan&apos;s client limit — upgrade below to invite more clients.
                </p>
              )}
            </div>
          )}

          <Button variant="outline" onClick={handleManageBilling} disabled={billingLoading || !stripeCustomerId}>
            Manage billing
          </Button>

          <div className="space-y-3">
            <p className="text-sm font-medium">Plans</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {TRAINER_PLANS.map((plan) => {
                const priceId = getPlanStripePriceId(plan.id);
                const isCurrent = plan.id === subscriptionTier;
                return (
                  <div key={plan.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{plan.name}</p>
                        {isCurrent && <Badge variant="secondary">Current</Badge>}
                      </div>
                      <p className="text-2xl font-semibold">
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Up to {plan.clientLimit} clients</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={!priceId || isCurrent || checkoutPlanId === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {!priceId
                        ? 'Not configured'
                        : isCurrent
                          ? 'Current plan'
                          : checkoutPlanId === plan.id
                            ? 'Redirecting...'
                            : 'Subscribe'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PF-321–324: Stripe Connect — trainer bills their clients */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Your Clients</CardTitle>
          <CardDescription>
            Connect a Stripe account to send invoices to clients. ZarcFit does not take a platform fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectOnboarded ? (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Billing ready — your Stripe account is connected
              </div>
              <Button
                className="gap-2"
                onClick={() => setInvoiceDialogOpen(true)}
                disabled={invoiceClients.length === 0}
              >
                <Send className="h-4 w-4" />
                Send Invoice
              </Button>
              {invoiceClients.length === 0 && (
                <p className="text-sm text-muted-foreground">Invite an active client before sending an invoice.</p>
              )}
            </>
          ) : (
            <Button className="gap-2" onClick={handleConnectStripe} disabled={connectLoading}>
              <CreditCard className="h-4 w-4" />
              {connectLoading ? 'Connecting...' : 'Connect Stripe to bill clients'}
            </Button>
          )}

          {/* CA-405: not tax/legal advice — just points trainers at the right place. */}
          <p className="text-xs text-muted-foreground border-t pt-3">
            Payouts, 1099-K reporting, and sales tax on client payments are handled by your Stripe
            Express account, not ZarcFit — see{' '}
            <a
              href="https://dashboard.stripe.com/settings/tax"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Stripe Tax
            </a>{' '}
            and your Express dashboard&apos;s tax forms for details. This isn&apos;t tax or legal advice —
            check with your accountant.
          </p>
        </CardContent>
      </Card>

      <InvoiceClientDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        clients={invoiceClients}
      />
    </div>
  );
}

export default function TrainerSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <TrainerSettingsContent />
    </Suspense>
  );
}
