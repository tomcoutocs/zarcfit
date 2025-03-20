'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { CheckCircle, XCircle } from 'lucide-react';

export default function EmailVerificationPage() {
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyOtp } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const email = searchParams.get('email');
        const token = searchParams.get('token');
        
        if (!email || !token) {
          setError('Invalid verification link. Please request a new one.');
          setIsVerifying(false);
          return;
        }
        
        const { error } = await verifyOtp(email, token);
        
        if (error) {
          setError(error.message);
          setIsVerified(false);
        } else {
          setIsVerified(true);
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, verifyOtp]);

  const handleContinue = () => {
    router.push(isVerified ? '/dashboard' : '/auth/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {isVerifying 
              ? 'Verifying your email address...' 
              : isVerified 
                ? 'Your email has been verified!' 
                : 'Email verification failed'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {isVerifying ? (
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          ) : isVerified ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isVerifying && (
            <div className="mt-6 text-center">
              <p className="mb-4">
                {isVerified 
                  ? 'Thank you for verifying your email address. You can now access all features of ZarcFit.' 
                  : 'We were unable to verify your email. Please try again or contact support if the problem persists.'
                }
              </p>
              <Button onClick={handleContinue}>
                {isVerified ? 'Continue to Dashboard' : 'Back to Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 