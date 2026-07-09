'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { invitationApi, clientManagementApi, PotentialClient } from '@/lib/supabase/trainer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, AlertCircle, CheckCircle, Search, UserPlus } from 'lucide-react';
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
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      if (invitation) {
        setSentToEmail(formData.email);
        setSuccess(true);
        // Reset form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          personalMessage: '',
        });

        // Redirect after 2 seconds
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
      {/* Back Button */}
      <Link href="/trainer/clients">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Add a Client</h1>
        <p className="text-muted-foreground">
          Connect with someone who already has a ZarcFit account, or invite someone new
        </p>
      </div>

      {success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Invitation Sent!
              </h3>
              <p className="text-muted-foreground mb-4">
                An invitation email has been sent to {sentToEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to sent invitations...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Find Existing Client
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-2">
              <Send className="h-4 w-4" />
              Send Email Invitation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <ClientSearchPanel />
          </TabsContent>

          <TabsContent value="invite">
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
                      We&apos;ll send the invitation to this email address
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
                    <Label htmlFor="personalMessage">
                      Personal Message (Optional)
                    </Label>
                    <Textarea
                      id="personalMessage"
                      name="personalMessage"
                      placeholder="Hi! I'd love to work with you on your fitness journey..."
                      value={formData.personalMessage}
                      onChange={handleChange}
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Add a personal message to make the invitation more welcoming
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                      <li>• Your client will receive an invitation email</li>
                      <li>• They&apos;ll create an account using the invitation link</li>
                      <li>• Once accepted, they&apos;ll appear in your client roster</li>
                      <li>• You&apos;ll be able to assign programs and track their progress</li>
                    </ul>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ClientSearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PotentialClient[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const runSearch = useCallback(async (search: string) => {
    if (search.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const data = await clientManagementApi.searchPotentialClients(search.trim());
      setResults(data);
    } catch (err) {
      console.error('Error searching for clients:', err);
      setSearchError('Something went wrong searching for clients. Please try again.');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(timeout);
  }, [query, runSearch]);

  const handleSendRequest = async (client: PotentialClient) => {
    setPendingIds((prev) => new Set(prev).add(client.client_id));

    try {
      const result = await clientManagementApi.sendConnectionRequest(client.client_id);

      if (result === 'sent') {
        setSentIds((prev) => new Set(prev).add(client.client_id));
      } else if (result === 'already_active' || result === 'already_pending') {
        setResults((prev) =>
          prev.map((r) =>
            r.client_id === client.client_id
              ? { ...r, relationship_status: result === 'already_active' ? 'active' : 'pending' }
              : r
          )
        );
      } else {
        setSearchError('Could not send the request. Please try again.');
      }
    } catch (err) {
      console.error('Error sending connection request:', err);
      setSearchError('Could not send the request. Please try again.');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(client.client_id);
        return next;
      });
    }
  };

  const displayName = (client: PotentialClient) =>
    client.first_name || client.last_name
      ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim()
      : client.email;

  const initials = (client: PotentialClient) => {
    const name = displayName(client);
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find an Existing Client</CardTitle>
        <CardDescription>
          Search by name or email for someone who already has a ZarcFit client account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {searchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        {searching ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Searching...</div>
        ) : query.trim().length < 2 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Type at least 2 characters to search for a client
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No client accounts found matching &quot;{query}&quot;
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((client) => {
              const isPending = pendingIds.has(client.client_id);
              const justSent = sentIds.has(client.client_id);
              const status = justSent ? 'pending' : client.relationship_status;

              return (
                <div
                  key={client.client_id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar>
                      <AvatarImage src={client.avatar_url} />
                      <AvatarFallback>{initials(client)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{displayName(client)}</p>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    </div>
                  </div>

                  {status === 'active' ? (
                    <Badge variant="secondary">Already your client</Badge>
                  ) : status === 'pending' ? (
                    <Badge variant="outline">Request pending</Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-2 shrink-0"
                      disabled={isPending}
                      onClick={() => handleSendRequest(client)}
                    >
                      {isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Send Request
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">What happens next?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• The client gets a connection request in their ZarcFit account</li>
            <li>• Once they accept, they&apos;ll appear in your client roster</li>
            <li>• You&apos;ll be able to assign programs and track their progress</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
