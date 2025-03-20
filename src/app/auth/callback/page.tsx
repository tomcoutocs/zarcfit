'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Processing your sign-in...');
  const [error, setError] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Exchange the code for a session
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          return;
        }
        
        // Redirect to dashboard on successful sign-in
        setMessage('Sign-in successful! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } catch (err) {
        console.error('Error during auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };
    
    handleCallback();
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Authentication</CardTitle>
          <CardDescription>
            {error ? 'Authentication Error' : 'Completing your sign-in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {!error && (
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          )}
          
          <p className={error ? 'text-red-500' : ''}>
            {error || message}
          </p>
          
          {error && (
            <button 
              onClick={() => router.push('/auth/login')}
              className="mt-4 text-primary hover:underline"
            >
              Return to login
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 