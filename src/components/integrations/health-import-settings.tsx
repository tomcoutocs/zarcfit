'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, RefreshCw } from 'lucide-react';

export function HealthImportSettings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadKey = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc('get_or_create_health_import_key');
    if (!error && data) setApiKey(data as string);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadKey();
  }, [loadKey]);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/health-import`
    : '/api/health-import';

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apple Health Import</CardTitle>
        <CardDescription>
          Connect Health Auto Export (iOS) or any webhook to sync sleep, weight, and workouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm space-y-2">
            <p>1. Install <strong>Health Auto Export</strong> on iOS</p>
            <p>2. Create an automation that POSTs JSON to the webhook URL below</p>
            <p>3. Add header: <code className="text-xs bg-muted px-1 rounded">x-api-key: YOUR_KEY</code></p>
            <p>4. Payload format:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{`{
  "sleep": [{ "date": "2026-07-04", "hours": 7.5 }],
  "weight": [{ "date": "2026-07-04", "kg": 75.2 }],
  "workouts": [{ "date": "2026-07-04", "name": "Run", "duration_minutes": 30 }]
}`}</pre>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">Webhook URL</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded break-all">{webhookUrl}</code>
            <Button size="icon" variant="outline" onClick={() => handleCopy(webhookUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Your API Key</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
              {loading ? 'Loading...' : apiKey || 'Unavailable â€” run health-import.sql in Supabase'}
            </code>
            {apiKey && (
              <Button size="icon" variant="outline" onClick={() => handleCopy(apiKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="outline" onClick={loadKey} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {copied && <p className="text-xs text-green-600">Copied to clipboard</p>}
      </CardContent>
    </Card>
  );
}
