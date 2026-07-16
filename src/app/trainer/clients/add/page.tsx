'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { buildInvitationUrl, invitationApi } from '@/lib/supabase/trainer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Link2, Send, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function InviteClientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    personalMessage: '',
  });

  const handleCopyLink = async () => {
    if (!invitationLink) return;

    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying invitation link:', err);
      setError('Could not copy the invitation link. Please copy it manually.');
    }
  };

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
      const result = await invitationApi.createInvitation({
        trainer_id: user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        personal_message: formData.personalMessage,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (result.status === 'success' && result.invitation.token) {
        setSentToEmail(formData.email);
        setInvitationLink(buildInvitationUrl(result.invitation.token));
        setSuccess(true);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          personalMessage: '',
        });
      } else if (result.status === 'is_trainer') {
        setError('This email belongs to a trainer account. Trainers cannot be added as clients.');
      } else {
        setError('Failed to create invitation. Please try again.');
      }
    } catch (err) {
      console.error('Error creating invitation:', err);
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
          Create an invitation link and share it with your client — they can only join ZarcFit through your invite
        </p>
      </div>

      {success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="py-4 space-y-5">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Invitation Created</h3>
                <p className="text-muted-foreground">
                  Share this link with {sentToEmail} so they can create their account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitation-link">Invitation link</Label>
                <div className="flex gap-2">
                  <Input
                    id="invitation-link"
                    readOnly
                    value={invitationLink}
                    className="font-mono text-sm"
                  />
                  <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={handleCopyLink}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Link2 className="h-4 w-4 mt-0.5 shrink-0" />
                  Email delivery is not automated yet — copy this link and send it to your client directly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" onClick={() => router.push('/trainer/clients?tab=invitations')}>
                  View all invitations
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSuccess(false);
                    setInvitationLink('');
                    setSentToEmail('');
                    setCopied(false);
                  }}
                >
                  Invite another client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Enter your client&apos;s details to generate an invitation link
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
                  Used to match the client when they accept the invitation
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Create Invitation
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
                  <li>• You&apos;ll get a copyable invitation link on the next screen</li>
                  <li>• Send that link to your client by email or message</li>
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
