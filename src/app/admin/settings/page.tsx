'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminSettingsPage() {
  const { user } = useAuth();

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Password updated successfully');
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError('Failed to update password. Please try again.');
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Admin Account</CardTitle>
          <CardDescription>Your admin login details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update the password for your admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          {passwordSuccess && (
            <Alert className="mb-4">
              <AlertDescription>{passwordSuccess}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
