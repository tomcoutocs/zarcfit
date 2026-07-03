'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Search, Users, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchClients() {
      if (!user?.id) return;

      try {
        const data = await clientManagementApi.getClients(user.id);
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, [user?.id]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client roster
          </p>
        </div>
        <Link href="/trainer/clients/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Invite Client
          </Button>
        </Link>
      </div>

      {/* Filters */}
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

      {/* Client List */}
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardDescription>Pending Invitations</CardDescription>
            <CardTitle className="text-3xl">
              {clients.filter((c) => c.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
