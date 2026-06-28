'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSleepRecords } from '@/hooks/use-dashboard';
import { sleepTrackingApi, SleepRecord } from '@/lib/supabase/dashboard-api';
import { supabase } from '@/lib/supabase';
import { SleepGraphs } from '@/components/sleep/SleepGraphs';
import SleepStats from '@/components/sleep/SleepStats';
import ConnectionReset from '@/components/ConnectionReset';
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

const FIX_AUTH_FUNCTION_SQL = `-- Fix auth.uid function SQL
-- First, fix the auth.uid function
DROP FUNCTION IF EXISTS get_auth_uid();

CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_id uuid;
BEGIN
  BEGIN
    auth_id := auth.uid();
    RETURN auth_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error accessing auth.uid: %', SQLERRM;
    RETURN NULL;
  END;
END;
$$;

ALTER FUNCTION get_auth_uid() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO anon;`;

export default function SleepTrackingPage() {
  const { user } = useAuth();
  const { sleepRecords, loading, error, refetch } = useSleepRecords(user?.id);
  const [selectedRecord, setSelectedRecord] = useState<SleepRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [showSql, setShowSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showAuthFunctionFix, setShowAuthFunctionFix] = useState(false);
  const [showConnectionReset, setShowConnectionReset] = useState(false);
  
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
  
  // SQL script for creating the sleep_tracking table
  const createTableSql = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sleep Tracking Table
CREATE TABLE IF NOT EXISTS sleep_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_duration_hours NUMERIC(4,2) NOT NULL,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  time_to_bed TIME,
  time_woke_up TIME,
  deep_sleep_hours NUMERIC(4,2),
  light_sleep_hours NUMERIC(4,2),
  rem_sleep_hours NUMERIC(4,2),
  sleep_disruptions INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the sleep_tracking table
ALTER TABLE sleep_tracking ENABLE ROW LEVEL SECURITY;

-- Sleep Tracking policies
CREATE POLICY "Users can view their own sleep tracking"
ON sleep_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep tracking"
ON sleep_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep tracking"
ON sleep_tracking FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep tracking"
ON sleep_tracking FOR DELETE
USING (auth.uid() = user_id);

-- Create Auth UID Function for testing
CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;
`.trim();

  // Function to copy SQL to clipboard
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(createTableSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };
  
  // Check if Supabase is accessible and sleep_tracking table exists
  const checkSupabaseTable = async () => {
    setApiStatus('Checking connection to Supabase...');
    
    try {
      // Try to refresh the auth session first to mitigate empty error objects
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.warn('Failed to refresh auth session:', refreshError);
      }
      
      const { error } = await supabase.from('sleep_tracking').select('id').limit(1);
      if (error) {
        console.error('Supabase error when checking sleep_tracking table:', error);
        
        // Handle empty error object case
        if (error && typeof error === 'object' && Object.keys(error).length === 0) {
          console.warn('Empty error object encountered. This might be an authentication issue.');
          setApiStatus('Authentication issue detected. Please try logging out and back in.');
          setShowConnectionReset(true);
          return false;
        }
        
        setApiStatus(`Error: ${error.message || 'Unknown error'} (Code: ${error.code || 'N/A'})`);
        
        // Check if this is a "relation does not exist" error
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setApiStatus('The sleep_tracking table does not exist. Please run the schema.sql in your Supabase dashboard.');
          setShowSql(true);
          return false;
        } 
        // Check if this is an RLS error
        else if (error.message?.includes('permission denied') || error.message?.includes('policy') || error.message?.includes('row-level security')) {
          setApiStatus('RLS policy violation detected. Please update your RLS policies.');
          return false;
        }

        return false;
      }

      // Table exists and the current user can query it (empty rows is OK)
      setApiStatus('Successfully connected to Supabase — sleep tracking is ready.');
      setShowSql(false);
      setShowAuthFunctionFix(false);
      setShowConnectionReset(false);
      return true;
    } catch (e) {
      // Handle errors outside the try block
      console.error('Error checking Supabase table:', e);
      setApiStatus('Error connecting to Supabase. Please check your network connection and try again.');
      
      // Show connection reset for general errors
      setShowConnectionReset(true);
      return false;
    }
    
    return false;
  };

  // Check API and Supabase status on component mount
  useEffect(() => {
    // Verify that the sleepTrackingApi is properly initialized
    console.log('Sleep tracking API status check:', {
      apiExists: !!sleepTrackingApi,
      createMethodExists: !!(sleepTrackingApi && typeof sleepTrackingApi.createSleepRecord === 'function'),
      supabaseClientExists: !!supabase
    });
    
    checkSupabaseTable();
  }, []);
  
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
      alert('You need to be logged in to track sleep');
      return;
    }
    
    // Log auth status to help debug
    console.log('Current auth status:', { 
      userId: user.id, 
      email: user.email,
      isAuthenticated: !!user
    });
    
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
    
    try {
      console.log('Submitting sleep record:', sleepRecord);
      setApiStatus('Attempting to save record...');
      
      // SIMPLIFIED APPROACH: Skip all the intermediate checks and go straight to the API
      // This is more reliable when dealing with RLS and empty error objects
      console.log('Using simplified direct API approach to save record');
      
      // For editing, use the standard API
      if (isEditing && selectedRecord?.id) {
        console.log('Updating existing sleep record...');
        const result = await sleepTrackingApi.updateSleepRecord(sleepRecord);
        console.log('Update successful:', result);
        setApiStatus('Record updated successfully');
        resetForm();
        setDialogOpen(false);
        refetch();
        return;
      }
      
      // For new records, try direct API endpoint first
      try {
        console.log('Adding new record via API endpoint');
        const response = await fetch('/api/sleep-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sleepRecord)
        });
        
        const responseText = await response.text();
        console.log('API response text:', responseText);
        
        if (!response.ok) {
          console.error('API error:', response.status, responseText);
          throw new Error(`API error (${response.status}): ${responseText}`);
        }
        
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('API success - Record added:', result);
          setApiStatus('Record added successfully via API');
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          throw new Error('Invalid API response format');
        }
        
        resetForm();
        setDialogOpen(false);
        refetch();
        return;
        
      } catch (apiError) {
        console.error('API endpoint failed, falling back to direct Supabase:', apiError);
        setApiStatus('API error, trying direct Supabase insert...');
        
        // Fall back to direct Supabase insert
        const { data, error } = await supabase
          .from('sleep_tracking')
          .insert([sleepRecord])
          .select()
          .single();
          
        // Handle empty error objects specifically
        if (error) {
          console.error('Supabase error details:', { 
            errorObject: error,
            isEmptyObject: Object.keys(error).length === 0,
            errorMessage: error.message || 'Empty error object',
            errorCode: error.code || 'No error code' 
          });
          
          // If it's an empty error object, report a more helpful message
          if (Object.keys(error).length === 0) {
            throw new Error('Supabase returned an empty error object. This may indicate authentication issues or service role key problems.');
          }
          
          throw error;
        }
        
        console.log('Direct Supabase insert success:', data);
        setApiStatus('Record added successfully via Supabase');
        resetForm();
        setDialogOpen(false);
        refetch();
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && Object.keys(error).length === 0)
          ? 'Empty error object received. Check console for details.'
          : 'Unknown error';
          
      console.error('Final error in sleep record submission:', error);
      setApiStatus(`Error: ${errorMessage}`);
      alert(`Error saving sleep record: ${errorMessage}`);
    }
  };
  
  // Delete record handler
  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this sleep record?')) {
      try {
        await sleepTrackingApi.deleteSleepRecord(id);
        refetch(); // Refresh the sleep records
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
      <h1 className="text-2xl font-bold mb-4">Sleep Tracking</h1>
      
      <div className="mb-6 bg-card p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className={`mb-2 ${apiStatus.includes('Error') || apiStatus.includes('issue') ? 'text-red-500' : 'text-green-500'}`}>
          {apiStatus}
        </p>
        
        {showConnectionReset && (
          <div className="mb-6">
            <ConnectionReset 
              onSuccess={() => {
                checkSupabaseTable();
                setShowConnectionReset(false);
              }} 
            />
          </div>
        )}
        
        {/* SQL instructions section */}
        {showSql && (
          <div className="bg-muted p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium mb-2">Create Table SQL</h3>
            <p className="mb-2 text-sm">
              Run this SQL in your Supabase SQL Editor to create the required table:
            </p>
            <div className="bg-black text-white p-3 rounded text-xs mb-2 overflow-x-auto">
              <pre>{createTableSql}</pre>
            </div>
            <Button 
              onClick={copySqlToClipboard} 
              variant="outline" 
              size="sm"
            >
              {sqlCopied ? 'Copied!' : 'Copy SQL'}
            </Button>
          </div>
        )}
        
        {/* Auth function fix section */}
        {showAuthFunctionFix && !showConnectionReset && (
          <div className="bg-muted p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium mb-2">Fix Auth Functions</h3>
            <p className="mb-2 text-sm">
              There appears to be an issue with the <code>auth.uid()</code> function. Please run the SQL fix script:
            </p>
            <div className="bg-black text-white p-3 rounded text-xs mb-2 overflow-x-auto">
              <pre>{FIX_AUTH_FUNCTION_SQL}</pre>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => navigator.clipboard.writeText(FIX_AUTH_FUNCTION_SQL)}
                variant="outline" 
                size="sm"
              >
                Copy SQL
              </Button>
              <Button
                onClick={checkSupabaseTable}
                variant="outline"
                size="sm"
              >
                Check Again
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sleep Tracking</h1>
          <p className="text-muted-foreground">Monitor and track your sleep patterns</p>
          {apiStatus && (
            <p className={`text-sm mt-1 ${apiStatus.includes('Error') || apiStatus.includes('Exception') ? 'text-red-500' : 'text-green-500'}`}>
              Status: {apiStatus}
            </p>
          )}
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
                <Button type="submit">{isEditing ? 'Update' : 'Save'} Record</Button>
                
                {/* Debug button */}
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={async () => {
                    if (!user?.id) {
                      alert('You need to be logged in');
                      return;
                    }
                    
                    try {
                      setApiStatus('Testing direct API call...');
                      
                      const sleepRecord = {
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
                      
                      console.log('DEBUG: Sending record directly to /api/sleep-records:', sleepRecord);
                      
                      const response = await fetch('/api/sleep-records', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sleepRecord)
                      });
                      
                      const responseText = await response.text();
                      console.log('DEBUG API raw response:', responseText);
                      
                      try {
                        const result = JSON.parse(responseText);
                        console.log('DEBUG API result:', result);
                        
                        if (response.ok) {
                          alert('Success! Record added via API.');
                          resetForm();
                          setDialogOpen(false);
                          refetch();
                        } else {
                          alert(`API Error: ${result.message || 'Unknown error'}`);
                        }
                      } catch {
                        alert(`Error parsing API response: ${responseText.substring(0, 100)}...`);
                      }
                    } catch (err) {
                      console.error('Debug API error:', err);
                      alert(`API call error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                  }}
                >
                  Debug API
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Display sleep stats */}
      {sleepRecords.length > 0 && (
        <>
          {/* Add enhanced sleep stats */}
          <SleepStats sleepRecords={sleepRecords} />
          
          {/* Remove original basic stats cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Latest Sleep</CardTitle>
                <CardDescription>
                  {latestRecord ? formatDate(latestRecord.date) : 'No records yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestRecord ? (
                  <div className="flex items-center space-x-2 text-2xl font-bold">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{latestRecord.sleep_duration_hours} hours</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sleep records found</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Average Duration</CardTitle>
                <CardDescription>Last {sleepRecords.length} records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-2xl font-bold">
                  <Moon className="h-5 w-5 text-primary" />
                  <span>{calculateAverageSleepDuration()} hours</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Average Quality</CardTitle>
                <CardDescription>Scale of 1-5</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-2xl font-bold">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-lg ${Number(calculateAverageSleepQuality()) >= star ? 'text-primary' : 'text-muted'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span>{calculateAverageSleepQuality()}</span>
                </div>
              </CardContent>
            </Card>
          </div> */}
        </>
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
              {/* Add Sleep Graphs component with explicit container */}
              <div className="w-full" style={{ minHeight: "500px", height: "500px" }}>
                <SleepGraphs sleepRecords={sleepRecords} />
              </div>
              
              {/* Existing table */}
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