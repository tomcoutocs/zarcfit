'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthShell from '@/components/layout/AuthShell';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signIn, signInWithProvider } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
      // The auth context will handle redirection to dashboard
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'github' | 'google' | 'apple') => {
    try {
      setSocialLoading(provider);
      setError('');
      await signInWithProvider(provider);
      // The OAuth flow will handle redirection
    } catch (err) {
      setError('An error occurred with social sign-in. Please try again.');
      console.error(err);
      setSocialLoading(null);
    }
  };

  return (
    <AuthShell title="Sign in to ZarcFit" subtitle="Access your personalized dashboard">
      <Card className="glass-card w-full border-border/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign in to ZarcFit</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Clients need an invitation from their trainer to join ZarcFit. If you received an invite, use the link in your email to create your account.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              variant="white"
              className="w-full font-semibold" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm space-y-1">
            <p>
              Are you a trainer?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Create a trainer account
              </Link>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => handleSocialSignIn('google')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'google' ? 'Connecting...' : 'Google'}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => handleSocialSignIn('apple')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'apple' ? 'Connecting...' : 'Apple'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </AuthShell>
  );
} 