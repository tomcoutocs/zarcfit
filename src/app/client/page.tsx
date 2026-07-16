'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/hooks/use-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import ConnectionReset from '@/components/ConnectionReset';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { clientManagementApi, TrainerWithProfile, notificationsApi } from '@/lib/supabase/trainer-api';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import NotificationsFeed from '@/components/NotificationsFeed';
import { ClientOnboardingChecklist } from '@/components/client/ClientOnboardingChecklist';
import { MessageSquare, UserRound } from 'lucide-react';
import { workoutLogsApi } from '@/lib/supabase/dashboard-api';
import { DashboardPageSkeleton } from '@/components/ui/dashboard-skeleton';

function trainerDisplayName(trainer: TrainerWithProfile) {
  return trainer.trainer_business_name || trainer.trainer_name || 'Your trainer';
}

function MyTrainerCard({ userId }: { userId: string }) {
  const [trainers, setTrainers] = useState<TrainerWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrainers = useCallback(async () => {
    const data = await clientManagementApi.getMyTrainers(userId);
    setTrainers(data.filter((trainer) => trainer.status === 'active'));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading your trainer...
        </CardContent>
      </Card>
    );
  }

  if (trainers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-muted-foreground" />
            Your Trainer
          </CardTitle>
          <CardDescription>
            Your trainer will appear here once you join through their invitation link.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{trainers.length === 1 ? 'Your Trainer' : 'Your Trainers'}</CardTitle>
        <CardDescription>
          {trainers.length === 1
            ? 'The coach managing your fitness program'
            : `${trainers.length} coaches connected to your account`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {trainers.map((trainer) => {
          const name = trainerDisplayName(trainer);
          const since = trainer.accepted_at
            ? new Date(trainer.accepted_at).toLocaleDateString()
            : null;

          return (
            <div
              key={trainer.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={trainer.trainer_avatar_url} alt={name} />
                  <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{name}</p>
                  {trainer.trainer_business_name && (
                    <p className="text-sm text-muted-foreground truncate">{trainer.trainer_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground truncate">{trainer.trainer_email}</p>
                  {since && (
                    <p className="text-xs text-muted-foreground mt-1">Coaching since {since}</p>
                  )}
                </div>
              </div>
              <Link href="/client/chat">
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const dashboardData = useDashboard(user?.id);
  const { notifications, unreadCount, refresh } = useRealtimeNotifications(10);
  const [showConnectionReset, setShowConnectionReset] = useState(false);
  const [hasTrainer, setHasTrainer] = useState(false);
  const [hasWorkoutLog, setHasWorkoutLog] = useState(false);

  useEffect(() => {
    async function loadOnboarding() {
      if (!user?.id) return;
      const [trainers, logs] = await Promise.all([
        clientManagementApi.getMyTrainers(user.id),
        workoutLogsApi.getUserLogs(user.id, 1),
      ]);
      setHasTrainer(trainers.some((t) => t.status === 'active'));
      setHasWorkoutLog(logs.length > 0);
    }
    loadOnboarding();
  }, [user?.id]);

  const handleMarkRead = async (notificationId: string) => {
    const ok = await notificationsApi.markRead(notificationId);
    if (ok) refresh();
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    refresh();
  };
  
  // Extract warnings and errors from dashboardData
  const { warnings, errors } = useMemo(() => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    if (dashboardData.error) {
      const errorMessage = dashboardData.error;
      
      // Check if the error is actually a warning (table doesn't exist or RLS issue)
      if (errorMessage.includes('does not exist') || errorMessage.includes('row-level security')) {
        warnings.push(errorMessage);
      } else {
        errors.push(errorMessage);
      }
    }
    
    return { warnings, errors };
  }, [dashboardData.error]);

  // Look for potential connection issues in the dashboardData error
  useEffect(() => {
    // Check if the dashboard error contains reference to an empty error object
    // or other connection-related issues
    if (dashboardData.error && 
        (dashboardData.error.includes('empty object') || 
         dashboardData.error.includes('Error fetching') ||
         dashboardData.error.includes('timeout') ||
         dashboardData.error.includes('authenticate'))) {
      setShowConnectionReset(true);
    } else {
      setShowConnectionReset(false);
    }
  }, [dashboardData.error]);

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to ZarcFit</CardTitle>
            <CardDescription>Please log in to access your dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const activeGoals = dashboardData.goals.filter((g) => !g.is_completed);
  
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Dashboard"
        description="Your fitness overview at a glance"
      />

      {user?.id && <MyTrainerCard userId={user.id} />}

      {user?.id && (
        <ClientOnboardingChecklist
          hasTrainer={hasTrainer}
          hasProgram={dashboardData.programs.length > 0}
          hasWorkoutLog={hasWorkoutLog}
        />
      )}

      {user?.id && (
        <NotificationsFeed
          title="Updates"
          description="New workouts, meal plans, and messages from your trainer"
          notifications={notifications}
          unreadCount={unreadCount}
          emptyMessage="You're all caught up. New program and message updates will appear here."
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {/* Display the connection troubleshooter if needed */}
      {showConnectionReset && (
        <div className="mb-6">
          <ConnectionReset 
            onSuccess={() => setShowConnectionReset(false)} 
          />
        </div>
      )}
      
      {/* Error handling alerts */}
      {warnings.length > 0 && (
        <div className="mb-6">
          {warnings.map((warning: string, index: number) => {
            // Show special alert for database setup issues
            if (warning.includes('does not exist')) {
              return (
                <Alert key={index} className="mb-2">
                  <AlertTitle>Missing Database Tables</AlertTitle>
                  <AlertDescription>
                    <p>{warning}</p>
                    <p className="mt-2 font-medium">Please run the schema SQL file to set up your database:</p>
                    <ol className="list-decimal list-inside mt-2 ml-4 space-y-1">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Navigate to the SQL Editor</li>
                      <li>Open the schema file located at <code className="bg-muted px-1 rounded">zarcfit/src/lib/supabase/schema.sql</code></li>
                      <li>Run the SQL commands to create all required tables</li>
                      <li>Refresh this page when complete</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              );
            }
            // Show special alert for Row Level Security policy issues
            else if (warning.includes('row-level security')) {
              return (
                <Alert key={index} className="mb-2">
                  <AlertTitle>Row Level Security Issue</AlertTitle>
                  <AlertDescription>
                    <p>{warning}</p>
                    <p className="mt-2 font-medium">You need to create data for your user account:</p>
                    <ol className="list-decimal list-inside mt-2 ml-4 space-y-1">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Navigate to the SQL Editor</li>
                      <li>Run the following SQL command (replace with your actual user ID):</li>
                      <pre className="bg-muted p-2 rounded mt-1 text-sm overflow-x-auto">
                        {`INSERT INTO user_profiles (id, first_name, last_name, bio, height_cm)
VALUES ('${user?.id || '[YOUR-USER-ID]'}', 'Your First Name', 'Your Last Name', 'Bio information', 170)
ON CONFLICT (id) DO NOTHING;`}
                      </pre>
                      <li>Refresh this page when complete</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              );
            }
            // General warning
            else {
              return (
                <Alert key={index} className="mb-2">
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              );
            }
          })}
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="mb-6">
          {errors.map((error: string, index: number) => (
            <Alert key={index} variant="destructive" className="mb-2">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {dashboardData.loading ? (
        <DashboardPageSkeleton />
      ) : dashboardData.error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{dashboardData.error}</p>
            
            {/* Show a Reset Connection button */}
            {!showConnectionReset && (
              <Button onClick={() => setShowConnectionReset(true)} variant="outline">
                Troubleshoot Connection
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {dashboardData.profile?.first_name && dashboardData.profile?.last_name 
                      ? `${dashboardData.profile.first_name} ${dashboardData.profile.last_name}`
                      : user.email}
                  </h3>
                  <p className="text-sm text-muted-foreground">{dashboardData.profile?.bio || 'No bio provided'}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Member since: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </CardFooter>
          </Card>
          
          {/* Workout Programs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Programs</CardTitle>
              <CardDescription>Your training programs</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.programs.length === 0 ? (
                <p className="text-muted-foreground">No workout programs found</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.programs.slice(0, 3).map(program => (
                    <div key={program.id} className="border-b pb-2">
                      <h3 className="font-medium">{program.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{program.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Total programs: {dashboardData.programs.length}
              </div>
            </CardFooter>
          </Card>
          
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Your fitness journey</CardDescription>
            </CardHeader>
            <CardContent>
              {!dashboardData.progress ? (
                <p className="text-muted-foreground">No progress data found</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{dashboardData.progress.weight_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Body Fat</p>
                      <p className="font-medium">{dashboardData.progress.body_fat_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {dashboardData.progress.date ? new Date(dashboardData.progress.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Last updated: {dashboardData.progress && dashboardData.progress.created_at 
                  ? new Date(dashboardData.progress.created_at).toLocaleDateString() 
                  : 'N/A'
                }
              </div>
            </CardFooter>
          </Card>
          
          {/* Goals Card */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Goals</CardTitle>
                <CardDescription>Your active fitness targets</CardDescription>
              </div>
              <Link href="/client/goals">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeGoals.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No active goals yet</p>
                  <Link href="/client/goals">
                    <Button size="sm">Set a goal</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="border-b pb-2 last:border-0">
                      <h3 className="font-medium">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground truncate">{goal.description}</p>
                      )}
                      <div className="mt-2 flex items-center">
                        <div className="bg-secondary h-2 rounded-full w-full overflow-hidden">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${goal.target_value && goal.current_value 
                                ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
                                : 0}%` 
                            }}
                          />
                        </div>
                        <span className="ml-2 text-xs whitespace-nowrap">
                          {goal.current_value}/{goal.target_value} {goal.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                {activeGoals.length} active · {dashboardData.goals.length} total
              </div>
            </CardFooter>
          </Card>
          
          {/* Upcoming Events Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your schedule</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground">No upcoming events</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="border-b pb-2">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} • {event.event_type}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Total events: {dashboardData.upcomingEvents.length}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 