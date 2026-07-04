'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, TrainerWithProfile } from '@/lib/supabase/trainer-api';
import { sessionRequestsApi, SessionRequest } from '@/lib/supabase/session-requests-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Check, X } from 'lucide-react';

export function SessionRequestPanel() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<TrainerWithProfile[]>([]);
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    trainer_id: '',
    requested_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    message: '',
  });

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [trainerList, requestList] = await Promise.all([
      clientManagementApi.getMyTrainers(user.id),
      sessionRequestsApi.getClientRequests(user.id),
    ]);
    const activeTrainers = trainerList.filter(t => t.status === 'active');
    setTrainers(activeTrainers);
    setRequests(requestList);
    if (activeTrainers.length === 1 && !form.trainer_id) {
      setForm(prev => ({ ...prev, trainer_id: activeTrainers[0].trainer_id }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !form.trainer_id) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    const result = await sessionRequestsApi.createRequest({
      client_id: user.id,
      trainer_id: form.trainer_id,
      requested_date: form.requested_date,
      start_time: form.start_time,
      end_time: form.end_time,
      message: form.message.trim() || undefined,
    });

    setSubmitting(false);
    if (result) {
      setSuccess('Session request sent to your trainer');
      setForm(prev => ({ ...prev, message: '' }));
      loadData();
    } else {
      setError('Failed to send request. Please try again.');
    }
  };

  const handleCancel = async (requestId: string) => {
    const ok = await sessionRequestsApi.cancelRequest(requestId);
    if (ok) loadData();
  };

  if (loading) return null;

  if (trainers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request a Session</CardTitle>
          <CardDescription>Connect with a trainer to request coaching sessions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Request a Session
        </CardTitle>
        <CardDescription>Propose a time for your trainer to approve</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        {success && (
          <Alert><AlertDescription>{success}</AlertDescription></Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Trainer</Label>
            <Select
              value={form.trainer_id}
              onValueChange={(v) => setForm(prev => ({ ...prev, trainer_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger>
              <SelectContent>
                {trainers.map(t => (
                  <SelectItem key={t.trainer_id} value={t.trainer_id}>
                    {t.trainer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="req_date">Date</Label>
              <Input
                id="req_date"
                type="date"
                value={form.requested_date}
                onChange={(e) => setForm(prev => ({ ...prev, requested_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req_start">Start</Label>
              <Input
                id="req_start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req_end">End</Label>
              <Input
                id="req_end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="req_message">Message (optional)</Label>
            <Textarea
              id="req_message"
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              rows={2}
              placeholder="What would you like to focus on?"
            />
          </div>

          <Button type="submit" disabled={submitting || !form.trainer_id}>
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </form>

        {pendingRequests.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm">Pending Requests</h4>
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                <div>
                  <p>{new Date(req.requested_date).toLocaleDateString()} · {req.start_time}–{req.end_time}</p>
                  {req.message && <p className="text-muted-foreground truncate">{req.message}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => req.id && handleCancel(req.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {requests.filter(r => r.status !== 'pending').slice(0, 3).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recent</h4>
            {requests.filter(r => r.status !== 'pending').slice(0, 3).map(req => (
              <div key={req.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                {req.status === 'approved' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
                <span>
                  {new Date(req.requested_date).toLocaleDateString()} — {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
