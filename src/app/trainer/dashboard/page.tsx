'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  clientManagementApi,
  ClientWithProfile,
  trainerDashboardApi,
  notificationsApi,
  UserNotification,
  ClientActivityItem,
  TrainerDashboardStats,
} from '@/lib/supabase/trainer-api';
import NotificationsFeed from '@/components/NotificationsFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { DashboardPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Plus,
  AlertCircle,
  Dumbbell,
  Bell,
  Activity,
  Moon,
  Target,
  TrendingUp,
} from 'lucide-react';

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function activityIcon(type: ClientActivityItem['activity_type']) {
  switch (type) {
    case 'workout':
      return Dumbbell;
    case 'progress':
      return TrendingUp;
    case 'goal':
      return Target;
    case 'message':
      return MessageSquare;
    case 'sleep':
      return Moon;
    default:
      return Activity;
  }
}

function activityLink(item: ClientActivityItem) {
  if (item.activity_type === 'message') {
    return `/trainer/messages?client=${item.client_id}`;
  }
  return `/trainer/clients/${item.client_id}`;
}

export default function TrainerDashboardPage() {
  const { user, isTrainer } = useAuth();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [stats, setStats] = useState<TrainerDashboardStats | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [clientActivity, setClientActivity] = useState<ClientActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.id || !isTrainer) {
        setLoading(false);
        return;
      }

      try {
        const [clientsData, statsData, notificationsData, unread, activityData] = await Promise.all([
          clientManagementApi.getClients(user.id),
          trainerDashboardApi.getStats(),
          notificationsApi.getNotifications(15),
          notificationsApi.getUnreadCount(),
          trainerDashboardApi.getClientActivity(50),
        ]);
        setClients(clientsData);
        setStats(statsData);
        setNotifications(notificationsData);
        setUnreadCount(unread);
        setClientActivity(activityData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.id, isTrainer]);

  const handleMarkRead = async (notificationId: string) => {
    const ok = await notificationsApi.markRead(notificationId);
    if (!ok) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  };

  if (loading) {
    return <DashboardPageSkeleton />;
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
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.workouts_this_week ?? 0}</div>
            <p className="text-xs text-muted-foreground">Workouts logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Unread notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unread_messages ?? 0}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sessions_today ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sessions today</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Clients</CardTitle>
            <CardDescription>Your current client roster</CardDescription>
          </CardHeader>
          <CardContent>
            {activeClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  You don&apos;t have any active clients yet
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
                  <Link key={client.id} href={`/trainer/clients/${client.client_id}`}>
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
                          <p className="text-sm text-muted-foreground">{client.client_email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
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

        <NotificationsFeed
          title="Latest Updates"
          description="New messages and client activity"
          notifications={notifications}
          unreadCount={unreadCount}
          emptyMessage="No updates yet. You'll see messages and client activity here."
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      </div>

      {pendingClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Clients who haven&apos;t accepted yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{client.client_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{client.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(client.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>All Client Updates</CardTitle>
          <CardDescription>
            Complete activity history from your clients, newest first
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Activity className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No client activity yet. Updates will appear here as clients log workouts, progress, and more.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {clientActivity.map((item) => {
                const Icon = activityIcon(item.activity_type);
                return (
                  <Link
                    key={`${item.activity_type}-${item.reference_id}`}
                    href={activityLink(item)}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 hover:bg-accent/40 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="mt-0.5 rounded-full bg-primary/10 p-2 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="font-medium">{item.client_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.occurred_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.occurred_at).toLocaleString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
