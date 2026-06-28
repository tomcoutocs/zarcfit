import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkSupabaseConnection, resetSupabaseConnection } from '@/lib/supabase/utils';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface ConnectionStatus {
  connected: boolean;
  responseTimeMs: number;
  authSessionValid: boolean;
  error: string | null;
  authError: string | null;
}

interface ConnectionResetProps {
  onSuccess?: () => void;
}

export default function ConnectionReset({ onSuccess }: ConnectionResetProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authUidError, setAuthUidError] = useState(false);
  const router = useRouter();

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage('Checking connection status...');
      
      const connectionStatus = await checkSupabaseConnection();
      setStatus(connectionStatus);
      
      if (connectionStatus.connected && connectionStatus.authSessionValid) {
        setMessage('Connection is working properly.');
        
        // Also check auth.uid function
        await checkAuthUid();
      } else {
        setMessage('Connection issues detected. Please try resetting the connection.');
      }
    } catch (err) {
      setError('Failed to check connection: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Check if auth.uid function is working
  const checkAuthUid = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: rpcError } = await supabase.rpc('get_auth_uid');
      
      if (rpcError) {
        console.error('Auth.uid error:', rpcError);
        setAuthUidError(true);
        
        if (rpcError && typeof rpcError === 'object' && Object.keys(rpcError).length === 0) {
          setMessage((prev) => `${prev || ''}\n\nEmpty error when accessing auth.uid. This could be an authentication issue. Try the Auth Fixes tab.`);
        } else if (rpcError.message?.includes('function') && rpcError.message?.includes('exist')) {
          setMessage((prev) => `${prev || ''}\n\nThe get_auth_uid function doesn't exist. Try the Auth Fixes tab.`);
        } else {
          setMessage((prev) => `${prev || ''}\n\nIssue with auth.uid: ${rpcError.message}. Try the Auth Fixes tab.`);
        }
      } else {
        setAuthUidError(false);
      }
    } catch (err) {
      console.error('Error checking auth.uid:', err);
      setAuthUidError(true);
      
      if (err && typeof err === 'object' && Object.keys(err).length === 0) {
        setMessage((prev) => `${prev || ''}\n\nEmpty error encountered when checking auth.uid. Try the Auth Fixes tab.`);
      }
    }
  };

  const resetConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage('Resetting connection...');
      
      const resetResult = await resetSupabaseConnection();
      setStatus(resetResult.newStatus);
      
      if (resetResult.success) {
        setMessage('Connection reset successful. Refreshing page in 3 seconds...');
        // Wait a bit and then refresh the page
        setTimeout(() => {
          router.refresh();
          if (onSuccess) onSuccess();
        }, 3000);
      } else {
        setMessage(`Reset attempt completed with issues: ${resetResult.message}`);
      }
    } catch (err) {
      setError('Failed to reset connection: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setMessage('Logging out and clearing session...');
      
      // This would normally use your auth context's signOut function
      // But for simplicity we'll just navigate to the logout page
      router.push('/auth/logout');
    } catch (err) {
      setError('Failed to initiate logout: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setLoading(false);
    }
  };

  const copyAuthFixSql = () => {
    const sql = `-- Fix auth.uid function SQL
DROP FUNCTION IF EXISTS get_auth_uid();

CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_id uuid;
BEGIN
  -- Use auth.uid() in a safer way
  BEGIN
    auth_id := auth.uid();
    RETURN auth_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error accessing auth.uid: %', SQLERRM;
    RETURN NULL;
  END;
END;
$$;

-- Fix permissions on the function
ALTER FUNCTION get_auth_uid() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO anon;`;

    navigator.clipboard.writeText(sql);
    setMessage('SQL copied to clipboard! Run this in your Supabase SQL Editor.');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connection Troubleshooter</CardTitle>
        <CardDescription>
          If you&apos;re experiencing issues with loading data, try these options to fix the connection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection">
          <TabsList className="mb-4">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="auth-fixes" className={authUidError ? "text-red-500 font-bold" : ""}>Auth Fixes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection">
            {message && (
              <Alert className="mb-4">
                <AlertDescription className="whitespace-pre-line">{message}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {status && (
              <div className="text-sm space-y-2 mb-4 p-3 bg-muted rounded-md">
                <p><strong>Connection:</strong> {status.connected ? 'OK' : 'Failed'}</p>
                <p><strong>Auth Session:</strong> {status.authSessionValid ? 'Valid' : 'Invalid'}</p>
                <p><strong>Response Time:</strong> {status.responseTimeMs.toFixed(2)}ms</p>
                {status.error && <p><strong>Error:</strong> {status.error}</p>}
              </div>
            )}
            
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                onClick={checkConnection} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Check Connection
              </Button>
              <Button 
                onClick={resetConnection} 
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                Reset Connection
              </Button>
              <Button 
                onClick={handleLogout} 
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                Log Out
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="auth-fixes">
            <div className="space-y-4">
              <Alert className="mb-4">
                <AlertDescription>
                  If you&apos;re seeing &quot;Error accessing auth.uid: {}&quot; or other auth function issues, 
                  you may need to fix the auth functions in your Supabase database.
                </AlertDescription>
              </Alert>
              
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs">
{`-- Fix auth.uid function SQL
DROP FUNCTION IF EXISTS get_auth_uid();

CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_id uuid;
BEGIN
  -- Use auth.uid() in a safer way
  BEGIN
    auth_id := auth.uid();
    RETURN auth_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error accessing auth.uid: %', SQLERRM;
    RETURN NULL;
  END;
END;
$$;

-- Fix permissions on the function
ALTER FUNCTION get_auth_uid() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_uid() TO anon;`}
                </pre>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Steps to fix:</h3>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Copy the SQL above</li>
                  <li>Go to your Supabase dashboard</li>
                  <li>Open the SQL Editor</li>
                  <li>Paste and run the SQL</li>
                  <li>Return here and check the connection again</li>
                </ol>
              </div>
              
              <Button 
                onClick={copyAuthFixSql} 
                disabled={loading}
                className="w-full"
              >
                Copy SQL to Clipboard
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 