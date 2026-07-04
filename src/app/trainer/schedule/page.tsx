'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import { calendarApi, CalendarEvent } from '@/lib/supabase';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';

type EventWithClient = CalendarEvent & { client_name: string };

const emptyForm = {
  client_id: '',
  title: '',
  date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '10:00',
};

function ScheduleContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [events, setEvents] = useState<EventWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    try {
      const clientList = await clientManagementApi.getClients(user.id);
      setClients(clientList);

      const activeClients = clientList.filter(c => c.status === 'active');
      const today = new Date().toISOString().split('T')[0];
      const rawEvents = await calendarApi.getEventsForUsers(
        activeClients.map(c => c.client_id),
        today
      );

      const clientNameById = new Map(activeClients.map(c => [c.client_id, c.client_name]));
      const withNames = rawEvents
        .map(e => ({ ...e, client_name: clientNameById.get(e.user_id) || 'Client' }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(withNames);
    } catch (err) {
      console.error(err);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = useCallback(() => {
    setForm({ ...emptyForm, client_id: preselectClientId || '' });
    setDialogOpen(true);
  }, [preselectClientId]);

  useEffect(() => {
    if (preselectClientId && !loading) {
      openCreateDialog();
    }
  }, [preselectClientId, loading, openCreateDialog]);

  const handleSave = async () => {
    if (!form.client_id || !form.title.trim()) return;
    setSaving(true);

    const created = await calendarApi.createEvent({
      user_id: form.client_id,
      title: form.title.trim(),
      date: form.date,
      start_time: `${form.date}T${form.start_time}:00`,
      end_time: `${form.date}T${form.end_time}:00`,
      is_all_day: false,
      event_type: 'coaching',
      has_reminder: true,
      is_recurring: false,
    });

    setSaving(false);

    if (created) {
      setDialogOpen(false);
      fetchData();
    } else {
      setError('Failed to schedule session. Please try again — this can happen if the client relationship isn\u2019t active yet.');
    }
  };

  const handleDelete = async (eventId: string | undefined) => {
    if (!eventId) return;
    if (!confirm('Cancel this session?')) return;
    const success = await calendarApi.deleteEvent(eventId);
    if (success) fetchData();
  };

  const groupedByDate = events.reduce<Record<string, EventWithClient[]>>((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Schedule" description="Manage upcoming sessions across all your clients">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule a Session</DialogTitle>
              <DialogDescription>Book a coaching session with a client.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(value) => setForm(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.status === 'active').map((client) => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Weekly Check-in"
                />
              </div>

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
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.client_id || !form.title.trim()}>
                {saving ? 'Scheduling...' : 'Schedule Session'}
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
      ) : Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No upcoming sessions scheduled</p>
            {clients.some(c => c.status === 'active') && (
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Your First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, dayEvents]) => (
            <Card key={date}>
              <CardContent className="pt-6">
                <h3 className="mb-3 font-semibold">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.client_name}
                            {event.start_time &&
                              ` · ${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainerSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
