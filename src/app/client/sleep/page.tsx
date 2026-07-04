'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSleepRecords } from '@/hooks/use-dashboard';
import { sleepTrackingApi, SleepRecord } from '@/lib/supabase/dashboard-api';
import { SleepGraphs } from '@/components/sleep/SleepGraphs';
import SleepStats from '@/components/sleep/SleepStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function SleepTrackingPage() {
  const { user } = useAuth();
  const { sleepRecords, loading, error, refetch } = useSleepRecords(user?.id);
  const [selectedRecord, setSelectedRecord] = useState<SleepRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepDuration, setSleepDuration] = useState(8.0);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [bedTime, setBedTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [deepSleep, setDeepSleep] = useState(2.0);
  const [lightSleep, setLightSleep] = useState(4.0);
  const [remSleep, setRemSleep] = useState(2.0);
  const [disruptions, setDisruptions] = useState(0);
  const [notes, setNotes] = useState('');

  // Reset form
  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setSleepDuration(8.0);
    setSleepQuality(3);
    setBedTime('22:00');
    setWakeTime('06:00');
    setDeepSleep(2.0);
    setLightSleep(4.0);
    setRemSleep(2.0);
    setDisruptions(0);
    setNotes('');
    setSelectedRecord(null);
    setIsEditing(false);
  };

  // Load record data for editing
  const loadRecordForEdit = (record: SleepRecord) => {
    setSelectedRecord(record);
    setDate(record.date);
    setSleepDuration(record.sleep_duration_hours);
    setSleepQuality(record.sleep_quality || 3);
    setBedTime(record.time_to_bed || '22:00');
    setWakeTime(record.time_woke_up || '06:00');
    setDeepSleep(record.deep_sleep_hours || 2.0);
    setLightSleep(record.light_sleep_hours || 4.0);
    setRemSleep(record.rem_sleep_hours || 2.0);
    setDisruptions(record.sleep_disruptions || 0);
    setNotes(record.notes || '');
    setIsEditing(true);
    setDialogOpen(true);
  };

  // Submit form handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setSubmitError('You need to be logged in to track sleep');
      return;
    }

    const sleepRecord: SleepRecord = {
      id: isEditing ? selectedRecord?.id : undefined,
      user_id: user.id,
      date,
      sleep_duration_hours: sleepDuration,
      sleep_quality: sleepQuality,
      time_to_bed: bedTime,
      time_woke_up: wakeTime,
      deep_sleep_hours: deepSleep,
      light_sleep_hours: lightSleep,
      rem_sleep_hours: remSleep,
      sleep_disruptions: disruptions,
      notes
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = isEditing && selectedRecord?.id
        ? await sleepTrackingApi.updateSleepRecord(sleepRecord)
        : await sleepTrackingApi.createSleepRecord(sleepRecord);

      if (!result) {
        throw new Error('Failed to save sleep record');
      }

      resetForm();
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(`Error saving sleep record: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete record handler
  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this sleep record?')) {
      try {
        await sleepTrackingApi.deleteSleepRecord(id);
        refetch();
      } catch (error) {
        console.error('Error deleting sleep record:', error);
      }
    }
  };

  // Format time
  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return 'Not recorded';

    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p>Loading sleep records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sleep Tracking</h1>
          <p className="text-muted-foreground">Monitor and track your sleep patterns</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsEditing(false); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Sleep Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Sleep Record' : 'Add New Sleep Record'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update the details of your sleep record.'
                  : 'Record details about your sleep from last night.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sleepDuration">Sleep Duration (hours): {sleepDuration}</Label>
                  <Slider
                    id="sleepDuration"
                    min={0}
                    max={12}
                    step={0.1}
                    value={[sleepDuration]}
                    onValueChange={(value) => setSleepDuration(value[0])}
                    aria-label="Sleep Duration"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sleepQuality">Sleep Quality (1-5): {sleepQuality}</Label>
                  <Slider
                    id="sleepQuality"
                    min={1}
                    max={5}
                    step={1}
                    value={[sleepQuality]}
                    onValueChange={(value) => setSleepQuality(value[0])}
                    aria-label="Sleep Quality"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bedTime">Bed Time</Label>
                    <Input
                      id="bedTime"
                      type="time"
                      value={bedTime}
                      onChange={(e) => setBedTime(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="wakeTime">Wake Time</Label>
                    <Input
                      id="wakeTime"
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deepSleep">Deep Sleep (hrs): {deepSleep}</Label>
                    <Slider
                      id="deepSleep"
                      min={0}
                      max={12}
                      step={0.1}
                      value={[deepSleep]}
                      onValueChange={(value) => setDeepSleep(value[0])}
                      aria-label="Deep Sleep"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lightSleep">Light Sleep (hrs): {lightSleep}</Label>
                    <Slider
                      id="lightSleep"
                      min={0}
                      max={12}
                      step={0.1}
                      value={[lightSleep]}
                      onValueChange={(value) => setLightSleep(value[0])}
                      aria-label="Light Sleep"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="remSleep">REM Sleep (hrs): {remSleep}</Label>
                    <Slider
                      id="remSleep"
                      min={0}
                      max={12}
                      step={0.1}
                      value={[remSleep]}
                      onValueChange={(value) => setRemSleep(value[0])}
                      aria-label="REM Sleep"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="disruptions">Sleep Disruptions: {disruptions}</Label>
                  <Slider
                    id="disruptions"
                    min={0}
                    max={10}
                    step={1}
                    value={[disruptions]}
                    onValueChange={(value) => setDisruptions(value[0])}
                    aria-label="Sleep Disruptions"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes about your sleep quality, dreams, or factors that affected your sleep..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : `${isEditing ? 'Update' : 'Save'} Record`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display sleep stats */}
      {sleepRecords.length > 0 && (
        <div className="mt-6">
          <SleepStats sleepRecords={sleepRecords} />
        </div>
      )}

      {/* Sleep records table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sleep History</CardTitle>
          <CardDescription>Your recent sleep records</CardDescription>
        </CardHeader>
        <CardContent>
          {sleepRecords.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No sleep records found</p>
              <p className="text-sm mt-2">Track your sleep to see your history here</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="w-full" style={{ minHeight: "500px", height: "500px" }}>
                <SleepGraphs sleepRecords={sleepRecords} />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>A history of your sleep records</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="hidden md:table-cell">Bed Time</TableHead>
                      <TableHead className="hidden md:table-cell">Wake Time</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sleepRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                        <TableCell>{record.sleep_duration_hours} hrs</TableCell>
                        <TableCell className="hidden md:table-cell">{formatTime(record.time_to_bed)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatTime(record.time_woke_up)}</TableCell>
                        <TableCell>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${(record.sleep_quality || 0) >= star ? 'text-primary' : 'text-muted'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => loadRecordForEdit(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => record.id && handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
