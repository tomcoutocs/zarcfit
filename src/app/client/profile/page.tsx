'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { userProfilesApi } from '@/lib/supabase/dashboard-api';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { ImageUpload } from '@/components/ui/image-upload';
import { HealthImportSettings } from '@/components/integrations/health-import-settings';
import { ProfilePreferences } from '@/components/profile/ProfilePreferences';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password change state (Security tab)
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data — `user_profiles` table is the source of truth for
  // first/last name and bio; phone stays in auth metadata since there's
  // no dedicated column for it yet.
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user) return;
      setProfileLoading(true);

      const profile = await userProfilesApi.getProfile(user.id);

      if (!isMounted) return;

      setFormData({
        firstName: profile?.first_name || user.user_metadata?.firstName || '',
        lastName: profile?.last_name || user.user_metadata?.lastName || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: profile?.bio || user.user_metadata?.bio || '',
      });
      setAvatarUrl(profile?.avatar_url || '');
      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const [profileResult, metadataResult] = await Promise.all([
        userProfilesApi.updateProfile({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          bio: formData.bio,
        }),
        createSupabaseBrowserClient().auth.updateUser({
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            bio: formData.bio,
          },
        }),
      ]);

      if (!profileResult) {
        setError('Failed to save profile details. Please try again.');
      } else if (metadataResult.error) {
        setError(metadataResult.error.message);
      } else {
        setSuccess('Profile updated successfully');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAvatarUploaded = async (url: string) => {
    if (!user) return;
    setAvatarUrl(url);
    await userProfilesApi.updateProfile({
      id: user.id,
      avatar_url: url,
    });
    setSuccess('Profile photo updated');
  };

  const getInitials = () => {
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <DashboardPageHeader title="Your Profile" description="Manage your personal information" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {user && (
                <ImageUpload
                  userId={user.id}
                  folder="avatars"
                  currentUrl={avatarUrl}
                  fallback={getInitials()}
                  onUploaded={handleAvatarUploaded}
                  size="lg"
                />
              )}
            </div>
            <CardTitle>{formData.firstName} {formData.lastName}</CardTitle>
            <CardDescription>{formData.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Member Since</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Coaching</h3>
                <p className="text-sm text-muted-foreground">Coaching via trainer invitation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Update your personal information and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="mb-4">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={profileLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={profileLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed directly. Please contact support.
                    </p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={profileLoading}
                    />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={profileLoading}
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading || profileLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="security">
                <div className="space-y-4">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Change Password</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Update your password to keep your account secure
                      </p>
                    </div>

                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    {passwordSuccess && (
                      <Alert>
                        <AlertDescription>{passwordSuccess}</AlertDescription>
                      </Alert>
                    )}

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

                    <Button type="submit" variant="outline" disabled={passwordLoading}>
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preferences">
                <div className="space-y-6">
                  <HealthImportSettings />
                  {user?.id && <ProfilePreferences userId={user.id} />}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
