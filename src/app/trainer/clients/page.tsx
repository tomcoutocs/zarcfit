'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  clientManagementApi,
  invitationApi,
  ClientWithProfile,
  ClientInvitation,
  buildInvitationUrl,
  getInvitationDisplayStatus,
} from '@/lib/supabase/trainer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Users,
  Filter,
  Mail,
  Copy,
  Check,
  X,
  Send,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

function invitationName(invitation: ClientInvitation) {
  const name = [invitation.first_name, invitation.last_name].filter(Boolean).join(' ');
  return name || invitation.email;
}

function invitationInitials(invitation: ClientInvitation) {
  return invitationName(invitation).substring(0, 2).toUpperCase();
}

function ClientsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'invitations' ? 'invitations' : 'clients';
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [invitationFilter, setInvitationFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [clientsData, invitationsData] = await Promise.all([
        clientManagementApi.getClients(user.id),
        invitationApi.getInvitations(user.id),
      ]);
      setClients(clientsData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredInvitations = invitations.filter((invitation) => {
    const displayStatus = getInvitationDisplayStatus(invitation);
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      invitation.email.toLowerCase().includes(query) ||
      (invitation.first_name?.toLowerCase().includes(query) ?? false) ||
      (invitation.last_name?.toLowerCase().includes(query) ?? false);

    const matchesStatus =
      invitationFilter === 'all' || displayStatus === invitationFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingInvitationCount = invitations.filter(
    (invitation) => getInvitationDisplayStatus(invitation) === 'pending'
  ).length;

  const handleCopyLink = async (invitation: ClientInvitation) => {
    if (!invitation.id || !invitation.token) return;

    try {
      await navigator.clipboard.writeText(buildInvitationUrl(invitation.token));
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying invitation link:', error);
      setActionError('Could not copy the invitation link.');
    }
  };

  const handleCancelInvitation = async (invitation: ClientInvitation) => {
    if (!user?.id || !invitation.id) return;
    if (!confirm(`Cancel the invitation sent to ${invitation.email}?`)) return;

    setCancellingId(invitation.id);
    setActionError('');

    const success = await invitationApi.cancelInvitation(invitation.id, user.id);
    if (success) {
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === invitation.id ? { ...item, status: 'cancelled' } : item
        )
      );
    } else {
      setActionError('Failed to cancel invitation. Please try again.');
    }

    setCancellingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  const getInvitationStatusBadge = (invitation: ClientInvitation) => {
    const status = getInvitationDisplayStatus(invitation);
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client roster and track sent invitations
          </p>
        </div>
        <Link href="/trainer/clients/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Invite Client
          </Button>
        </Link>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Clients</CardDescription>
            <CardTitle className="text-3xl">{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Clients</CardDescription>
            <CardTitle className="text-3xl">
              {clients.filter((c) => c.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Connection Requests</CardDescription>
            <CardTitle className="text-3xl">
              {clients.filter((c) => c.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Email Invitations</CardDescription>
            <CardTitle className="text-3xl">{pendingInvitationCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            My Clients
            <Badge variant="secondary" className="ml-1">
              {clients.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="h-4 w-4" />
            Sent Invitations
            {pendingInvitationCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingInvitationCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No clients found'
                    : 'No clients yet'}
                </h3>
                <p className="text-muted-foreground mb-4 text-center max-w-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start building your client roster by inviting your first client'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Link href="/trainer/clients/add">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite Your First Client
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Link key={client.id} href={`/trainer/clients/${client.client_id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={client.client_profile?.avatar_url} />
                            <AvatarFallback>
                              {client.client_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {client.client_name}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {client.client_email}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(client.status)}
                        <p className="text-sm text-muted-foreground">
                          {client.accepted_at
                            ? `Since ${new Date(client.accepted_at).toLocaleDateString()}`
                            : `Invited ${new Date(client.invited_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {client.notes && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {client.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
              <CardDescription>
                Email invitations you&apos;ve sent to people who don&apos;t have a ZarcFit account yet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invitations by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={invitationFilter} onValueChange={setInvitationFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery || invitationFilter !== 'all'
                      ? 'No invitations found'
                      : 'No invitations sent yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    {searchQuery || invitationFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Send an email invitation from the Add Client page to invite someone new to ZarcFit'}
                  </p>
                  {!searchQuery && invitationFilter === 'all' && (
                    <Link href="/trainer/clients/add">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvitations.map((invitation) => {
                      const displayStatus = getInvitationDisplayStatus(invitation);
                      const canCopy = displayStatus === 'pending' && invitation.token;
                      const canCancel = displayStatus === 'pending' && invitation.id;

                      return (
                        <TableRow key={invitation.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{invitationInitials(invitation)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{invitationName(invitation)}</p>
                                <p className="text-sm text-muted-foreground">{invitation.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getInvitationStatusBadge(invitation)}</TableCell>
                          <TableCell>
                            {invitation.created_at
                              ? new Date(invitation.created_at).toLocaleDateString()
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {invitation.expires_at
                              ? new Date(invitation.expires_at).toLocaleDateString()
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canCopy && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleCopyLink(invitation)}
                                >
                                  {copiedId === invitation.id ? (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      Copy Link
                                    </>
                                  )}
                                </Button>
                              )}
                              {canCancel && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-2 text-destructive hover:text-destructive"
                                  disabled={cancellingId === invitation.id}
                                  onClick={() => handleCancelInvitation(invitation)}
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  );
}
