'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import { sessionRequestsApi, SessionRequest } from '@/lib/supabase/session-requests-api';
import { calendarApi, CalendarEvent } from '@/lib/supabase';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  Clock,
  Check,
  X,
  Link as LinkIcon,
} from 'lucide-react';

type EventWithClient = CalendarEvent & { client_name: string };
type SessionMode = 'session' | 'unavailable';

type FormState = {
  mode: SessionMode;
  client_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  meeting_url: string;
  note: string;
};

const emptyForm: FormState = {
  mode: 'session',
  client_id: '',
  title: '',
  date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '10:00',
  meeting_url: '',
  note: '',
};

function formatMonthYear(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatTimeLabel(timeString?: string) {
  if (!timeString) return '';
  return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ScheduleContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const today = new Date();

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [events, setEvents] = useState<EventWithClient[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [monthYear, setMonthYear] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingEvent, setEditingEvent] = useState<EventWithClient | undefined>(undefined);

  const activeClients = clients.filter((c) => c.status === 'active');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    try {
      const clientList = await clientManagementApi.getClients(user.id);
      setClients(clientList);

      const active = clientList.filter((c) => c.status === 'active');
      const startDate = toDateInput(new Date(monthYear.year, monthYear.month - 1, 1));
      const endDate = toDateInput(new Date(monthYear.year, monthYear.month, 0));

      const [rawEvents, requests] = await Promise.all([
        calendarApi.getEventsForUsers(
          [user.id, ...active.map((c) => c.client_id)],
          startDate,
          endDate
        ),
        sessionRequestsApi.getTrainerPendingRequests(user.id),
      ]);

      setPendingRequests(requests);

      const clientNameById = new Map(active.map((c) => [c.client_id, c.client_name]));
      const withNames = rawEvents
        .map((e) => ({
          ...e,
          client_name: e.user_id === user.id ? 'You' : clientNameById.get(e.user_id) || 'Client',
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(withNames);
    } catch (err) {
      console.error(err);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, monthYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep the selected day in sync with whichever month is on screen so the
  // week toggle doesn't silently show an empty/stale week.
  useEffect(() => {
    setSelectedDate((prev) => {
      if (prev.getFullYear() === monthYear.year && prev.getMonth() + 1 === monthYear.month) {
        return prev;
      }
      const isCurrentRealMonth =
        monthYear.year === today.getFullYear() && monthYear.month === today.getMonth() + 1;
      return isCurrentRealMonth ? new Date() : new Date(monthYear.year, monthYear.month - 1, 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthYear]);

  const goToPreviousMonth = () =>
    setMonthYear((prev) => {
      const newMonth = prev.month === 1 ? 12 : prev.month - 1;
      const newYear = prev.month === 1 ? prev.year - 1 : prev.year;
      return { month: newMonth, year: newYear };
    });

  const goToNextMonth = () =>
    setMonthYear((prev) => {
      const newMonth = prev.month === 12 ? 1 : prev.month + 1;
      const newYear = prev.month === 12 ? prev.year + 1 : prev.year;
      return { month: newMonth, year: newYear };
    });

  const goToToday = () => {
    const now = new Date();
    setMonthYear({ month: now.getMonth() + 1, year: now.getFullYear() });
    setSelectedDate(now);
  };

  const openDialog = useCallback(
    (opts?: { mode?: SessionMode; date?: Date; event?: EventWithClient }) => {
      if (opts?.event) {
        const ev = opts.event;
        setEditingEvent(ev);
        if (ev.event_type === 'unavailable') {
          setForm({
            ...emptyForm,
            mode: 'unavailable',
            date: ev.date,
            note: ev.description || '',
          });
        } else {
          setForm({
            ...emptyForm,
            mode: 'session',
            client_id: ev.user_id,
            title: ev.title,
            date: ev.date,
            start_time: ev.start_time ? ev.start_time.split('T')[1]?.substring(0, 5) || '09:00' : '09:00',
            end_time: ev.end_time ? ev.end_time.split('T')[1]?.substring(0, 5) || '10:00' : '10:00',
            meeting_url: ev.meeting_url || '',
          });
        }
      } else {
        setEditingEvent(undefined);
        setForm({
          ...emptyForm,
          mode: opts?.mode || 'session',
          client_id: preselectClientId || '',
          date: toDateInput(opts?.date || new Date()),
        });
      }
      setDialogOpen(true);
    },
    [preselectClientId]
  );

  useEffect(() => {
    if (preselectClientId && !loading) {
      openDialog({ mode: 'session' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectClientId, loading]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    openDialog({ mode: 'session', date });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setError('');

    if (form.mode === 'session' && (!form.client_id || !form.title.trim())) return;

    setSaving(true);

    const payload: CalendarEvent =
      form.mode === 'session'
        ? {
            id: editingEvent?.id,
            user_id: form.client_id,
            title: form.title.trim(),
            date: form.date,
            start_time: `${form.date}T${form.start_time}:00`,
            end_time: `${form.date}T${form.end_time}:00`,
            is_all_day: false,
            event_type: 'coaching',
            has_reminder: true,
            is_recurring: false,
            meeting_url: form.meeting_url.trim() || undefined,
          }
        : {
            id: editingEvent?.id,
            user_id: user.id,
            title: 'Unavailable',
            description: form.note.trim() || undefined,
            date: form.date,
            is_all_day: true,
            event_type: 'unavailable',
            has_reminder: false,
            is_recurring: false,
          };

    const result = editingEvent
      ? await calendarApi.updateEvent(payload)
      : await calendarApi.createEvent(payload);

    setSaving(false);

    if (result) {
      setDialogOpen(false);
      fetchData();
    } else {
      setError(
        form.mode === 'session'
          ? 'Failed to save session. Please try again — this can happen if the client relationship isn\u2019t active yet.'
          : 'Failed to save. Please try again.'
      );
    }
  };

  const handleDelete = async () => {
    if (!editingEvent?.id) return;
    const isUnavailable = editingEvent.event_type === 'unavailable';
    if (!confirm(isUnavailable ? 'Remove this blocked day?' : 'Cancel this session?')) return;

    const success = await calendarApi.deleteEvent(editingEvent.id);
    if (success) {
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'approve' | 'decline') => {
    const result = await sessionRequestsApi.respondToRequest(requestId, action);
    if (result.success) {
      fetchData();
    } else {
      setError(result.error || 'Failed to respond to request');
    }
  };

  const weekStart = startOfWeek(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekDateStrings = weekDates.map(toDateInput);
  const weekEvents = events.filter((e) => weekDateStrings.includes(e.date));
  const groupedWeek = weekDates.reduce<Record<string, EventWithClient[]>>((acc, d) => {
    acc[toDateInput(d)] = weekEvents.filter((e) => e.date === toDateInput(d));
    return acc;
  }, {});

  const isEditMode = !!editingEvent;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Schedule" description="Manage upcoming sessions across all your clients">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => openDialog({ mode: 'unavailable', date: selectedDate })}>
            <Ban className="h-4 w-4" />
            Block Day
          </Button>
          <Button className="gap-2" onClick={() => openDialog({ mode: 'session', date: selectedDate })}>
            <Plus className="h-4 w-4" />
            Schedule Session
          </Button>
        </div>
      </DashboardPageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {clients.length > 0 && activeClients.length === 0 && (
        <Alert>
          <AlertDescription>
            You don&apos;t have any active clients yet — sessions can only be scheduled with active clients.
          </AlertDescription>
        </Alert>
      )}

      {pendingRequests.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Pending Session Requests ({pendingRequests.length})</h3>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{req.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(req.requested_date).toLocaleDateString()} · {req.start_time}–{req.end_time}
                    </p>
                    {req.message && <p className="text-sm mt-1">{req.message}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => req.id && handleRequestResponse(req.id, 'approve')}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => req.id && handleRequestResponse(req.id, 'decline')}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={loading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">{formatMonthYear(monthYear.year, monthYear.month)}</h2>
            <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={loading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={goToToday} disabled={loading}>
              Today
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Coaching Session
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-500" /> Unavailable
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : viewMode === 'month' ? (
            <div className="w-full">
              <CalendarHeader />
              <CalendarGrid
                year={monthYear.year}
                month={monthYear.month}
                events={events}
                showAddButton
                onDateClick={handleDateClick}
                onEventClick={(event) => openDialog({ event: event as EventWithClient })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; })}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev week
                </Button>
                <p className="text-sm font-medium">
                  {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                  {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; })}
                >
                  Next week
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {weekEvents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No events this week</div>
              ) : (
                weekDates.map((d) => {
                  const dayEvents = groupedWeek[toDateInput(d)];
                  if (!dayEvents || dayEvents.length === 0) return null;
                  return (
                    <div key={toDateInput(d)}>
                      <h3 className="mb-2 text-sm font-semibold">
                        {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-accent/50"
                            onClick={() => openDialog({ event })}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full p-2 ${event.event_type === 'unavailable' ? 'bg-gray-200' : 'bg-primary/10'}`}>
                                {event.event_type === 'unavailable' ? (
                                  <Ban className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {event.event_type === 'unavailable' ? 'All day' : event.client_name}
                                  {event.start_time && !event.is_all_day && ` · ${formatTimeLabel(event.start_time)}`}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? form.mode === 'unavailable'
                  ? 'Blocked Day'
                  : 'Edit Session'
                : form.mode === 'unavailable'
                ? 'Block a Day'
                : 'Schedule a Session'}
            </DialogTitle>
            <DialogDescription>
              {form.mode === 'unavailable'
                ? 'Mark a day as unavailable so clients can\u2019t request sessions on it.'
                : 'Book a coaching session with a client.'}
            </DialogDescription>
          </DialogHeader>

          {!isEditMode && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={form.mode === 'session' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setForm((prev) => ({ ...prev, mode: 'session' }))}
              >
                Coaching Session
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.mode === 'unavailable' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setForm((prev) => ({ ...prev, mode: 'unavailable' }))}
              >
                Block Day
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {form.mode === 'session' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={form.client_id}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, client_id: value }))}
                    disabled={isEditMode}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeClients.map((client) => (
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
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Weekly Check-in"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_url">Meeting Link (optional)</Label>
                  <Input
                    id="meeting_url"
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={form.meeting_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, meeting_url: e.target.value }))}
                  />
                  {form.meeting_url && (
                    <a
                      href={form.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Open link
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="unavailable_date">Date</Label>
                  <Input
                    id="unavailable_date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unavailable_note">Note (optional)</Label>
                  <Textarea
                    id="unavailable_note"
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Out of office"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            {isEditMode && (
              <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto">
                {form.mode === 'unavailable' ? 'Remove Block' : 'Cancel Session'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (form.mode === 'session' && (!form.client_id || !form.title.trim()))}
            >
              {saving ? 'Saving...' : form.mode === 'unavailable' ? 'Block Day' : isEditMode ? 'Save Changes' : 'Schedule Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
