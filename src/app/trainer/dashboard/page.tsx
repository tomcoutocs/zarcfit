'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, trainerProfileApi, ClientWithProfile } from '@/lib/supabase/trainer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Plus,
  AlertCircle,
  Dumbbell,
  Activity
} from 'lucide-react';

export default function TrainerDashboardPage() {
  const { user, isTrainer } = useAuth();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.id || !isTrainer) {
        setLoading(false);
        return;
      }

      try {
        const clientsData = await clientManagementApi.getClients(user.id);
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id, isTrainer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isTrainer) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be a trainer to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.status === 'active');
  const pendingClients = clients.filter(c => c.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your clients and track their progress
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trainer/clients/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingClients.length > 0 && `${pendingClients.length} pending`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Workouts logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Sessions today
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Client List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Clients</CardTitle>
            <CardDescription>
              Your current client roster
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  You don't have any active clients yet
                </p>
                <Link href="/trainer/clients/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Your First Client
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeClients.slice(0, 5).map((client) => (
                  <Link
                    key={client.id}
                    href={`/trainer/clients/${client.client_id}`}
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={client.client_profile?.avatar_url} />
                          <AvatarFallback>
                            {client.client_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.client_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.client_email}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </Link>
                ))}
                {activeClients.length > 5 && (
                  <Link href="/trainer/clients">
                    <Button variant="outline" className="w-full">
                      View All {activeClients.length} Clients
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest client updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Activity feed coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pendingClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Clients who haven't accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {client.client_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{client.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(client.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/trainer/clients/add">
              <Button variant="outline" className="w-full h-auto flex-col py-6 gap-2">
                <Plus className="h-6 w-6" />
                <span>Invite Client</span>
              </Button>
            </Link>
            <Link href="/trainer/programs">
              <Button variant="outline" className="w-full h-auto flex-col py-6 gap-2">
                <Dumbbell className="h-6 w-6" />
                <span>Create Program</span>
              </Button>
            </Link>
            <Link href="/trainer/messages">
              <Button variant="outline" className="w-full h-auto flex-col py-6 gap-2">
                <MessageSquare className="h-6 w-6" />
                <span>Messages</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
