'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, TrainerClient } from '@/lib/supabase/trainer-api';
import { userProfilesApi, UserProfile } from '@/lib/supabase/dashboard-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  Utensils,
  TrendingUp,
  MessageSquare,
  Calendar,
} from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clientId = params?.clientId as string;

  const [loading, setLoading] = useState(true);
  const [clientRelation, setClientRelation] = useState<TrainerClient | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchClientData() {
      if (!user?.id || !clientId) return;

      try {
        const relation = await clientManagementApi.getClient(user.id, clientId);
        const profile = await userProfilesApi.getProfile(clientId);
        
        setClientRelation(relation);
        setClientProfile(profile);
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [user?.id, clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clientRelation || !clientProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Link href="/trainer/clients">
          <Button>Back to Clients</Button>
        </Link>
      </div>
    );
  }

  const clientName = clientProfile.first_name && clientProfile.last_name
    ? `${clientProfile.first_name} ${clientProfile.last_name}`
    : 'Client';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/trainer/clients">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      {/* Client Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={clientProfile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {clientName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{clientName}</h1>
                  <Badge className="bg-green-500">
                    {clientRelation.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {clientProfile.bio || 'No bio available'}
                </p>
                <div className="flex gap-2">
                  <Button className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {clientRelation.accepted_at 
                  ? new Date(clientRelation.accepted_at).toLocaleDateString()
                  : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-medium">
                {clientProfile.height_cm ? `${clientProfile.height_cm} cm` : 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  No recent activity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Assigned Programs
                </CardTitle>
                <CardDescription>
                  Active training programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  No programs assigned
                </p>
                <Button variant="outline" className="w-full">
                  Assign Program
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workouts">
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>
                View and track client workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No workouts logged yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Tracking</CardTitle>
              <CardDescription>
                Meal plans and nutrition logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No nutrition data available
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Weight, measurements, and photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No progress data recorded
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Trainer Notes</CardTitle>
              <CardDescription>
                Private notes about this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No notes yet
              </p>
              <Button variant="outline" className="w-full">
                Add Note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
