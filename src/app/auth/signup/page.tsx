'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import AuthShell from '@/components/layout/AuthShell';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signUp, signInWithProvider } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email is invalid';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include a special character';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!acceptTerms) return 'You must accept the terms and conditions';
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const { error: signUpError, resentConfirmation } = await signUp(email, password, {
        firstName,
        lastName,
      }, 'trainer');
      
      if (signUpError) {
        let errorMessage = signUpError.message;
        
        if (errorMessage.includes('Database error')) {
          errorMessage = 'Database error while creating user. Please contact support or try again later.';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please log in instead.';
        }
        
        setError(errorMessage);
      } else {
        router.push(
          `/auth/email-verification?email=${encodeURIComponent(email)}${
            resentConfirmation ? '&resent=1' : ''
          }`
        );
      }
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'github' | 'google' | 'apple') => {
    try {
      if (!acceptTerms) {
        setError('You must accept the terms and conditions');
        return;
      }
      
      setSocialLoading(provider);
      setError('');
      await signInWithProvider(provider, { signupRole: 'trainer' });
    } catch (err) {
      setError('An error occurred with social sign-up. Please try again.');
      console.error(err);
      setSocialLoading(null);
    }
  };

  return (
    <AuthShell title="Become a trainer" subtitle="Create your coaching account on ZarcFit">
      <Card className="glass-card w-full border-border/60 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Trainer registration</CardTitle>
          <CardDescription>
            Sign up as a coach to manage clients and training programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Looking to train with a coach? Clients join ZarcFit through an invitation from their trainer — you cannot create a client account here.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
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
              <Label htmlFor="password">Password</Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            <Button 
              variant="white"
              className="w-full font-semibold" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Trainer Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
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
              <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => handleSocialSignUp('google')}
              disabled={!!socialLoading}
            >
              {socialLoading === 'google' ? 'Connecting...' : 'Google'}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => handleSocialSignUp('apple')}
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
