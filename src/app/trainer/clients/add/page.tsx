'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { invitationApi } from '@/lib/supabase/trainer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function InviteClientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    personalMessage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('You must be logged in to invite clients');
      return;
    }

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const invitation = await invitationApi.createInvitation({
        trainer_id: user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        personal_message: formData.personalMessage,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (invitation) {
        setSentToEmail(formData.email);
        setSuccess(true);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          personalMessage: '',
        });

        setTimeout(() => {
          router.push('/trainer/clients?tab=invitations');
        }, 2000);
      } else {
        setError('Failed to send invitation. Please try again.');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/trainer/clients">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Invite a Client</h1>
        <p className="text-muted-foreground">
          Send an email invitation — clients can only join ZarcFit through your invite link
        </p>
      </div>

      {success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Invitation Sent!</h3>
              <p className="text-muted-foreground mb-4">
                An invitation has been created for {sentToEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to sent invitations...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Enter your client&apos;s details to send them an invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Share the invitation link from Sent Invitations after sending
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                <Textarea
                  id="personalMessage"
                  name="personalMessage"
                  placeholder="Hi! I'd love to work with you on your fitness journey..."
                  value={formData.personalMessage}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Link href="/trainer/clients">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• The invitation appears under Sent Invitations on your Clients page</li>
                  <li>• Copy the invite link and send it to your client</li>
                  <li>• They create an account and are automatically linked to you</li>
                  <li>• You can then assign programs and track their progress</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
