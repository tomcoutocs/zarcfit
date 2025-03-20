'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.user_metadata?.firstName || '',
        lastName: user.user_metadata?.lastName || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: user.user_metadata?.bio || '',
      });
    }
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
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          bio: formData.bio,
        }
      });
      
      if (error) {
        setError(error.message);
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

  const getInitials = () => {
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
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
                <h3 className="font-medium">Subscription</h3>
                <p className="text-sm text-muted-foreground">Free Plan</p>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
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
                    />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="security">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your password to keep your account secure
                    </p>
                    <Button variant="outline">
                      Reset Password
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preferences">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage how and when you receive notifications
                    </p>
                    <Button variant="outline">
                      Manage Notifications
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Privacy Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Control your data and privacy settings
                    </p>
                    <Button variant="outline">
                      Manage Privacy
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 