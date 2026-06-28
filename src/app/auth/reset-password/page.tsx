'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthShell from '@/components/layout/AuthShell';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { completeAuthFromUrl } from '@/lib/supabase/auth-callback';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const { resetPassword } = useAuth();

  useEffect(() => {
    const establishSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: callbackError, handled } = await completeAuthFromUrl(supabase);

        if (handled && callbackError) {
          setError(callbackError);
          setSessionReady(false);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          setSessionReady(!!session);
          if (handled && session) {
            window.history.replaceState({}, '', '/auth/reset-password');
          }
        }
      } catch (err) {
        console.error(err);
        setError('Invalid or expired reset link. Please request a new one.');
      } finally {
        setCheckingLink(false);
      }
    };

    establishSession();
  }, []);

  const validatePassword = () => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include a special character';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password has been reset successfully. Redirecting to login...');
        // The auth context will handle redirection to login page
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password for your account">
      <Card className="glass-card w-full border-border/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create new password</CardTitle>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkingLink ? (
            <div className="flex justify-center py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : !sessionReady && !success ? (
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'This reset link is invalid or has expired. Request a new link from the forgot password page.'}
              </AlertDescription>
            </Alert>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long and include a number and special character.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading || !sessionReady}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
} 