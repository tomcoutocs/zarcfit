'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Dumbbell,
  MessageSquare,
  Moon,
  Target,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserNotification } from '@/lib/supabase/trainer-api';

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
  return date.toLocaleDateString();
}

function notificationIcon(type: UserNotification['type']) {
  switch (type) {
    case 'workout_assigned':
    case 'workout_logged':
      return Dumbbell;
    case 'meal_plan':
      return Utensils;
    case 'message':
      return MessageSquare;
    case 'progress_logged':
      return TrendingUp;
    case 'goal_updated':
      return Target;
    case 'sleep_logged':
      return Moon;
    default:
      return Bell;
  }
}

type NotificationsFeedProps = {
  title: string;
  description: string;
  notifications: UserNotification[];
  unreadCount: number;
  emptyMessage: string;
  onMarkRead: (id: string) => void;
  onMarkAllRead?: () => void;
};

export default function NotificationsFeed({
  title,
  description,
  notifications,
  unreadCount,
  emptyMessage,
  onMarkRead,
  onMarkAllRead,
}: NotificationsFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            {title}
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const Icon = notificationIcon(item.type);
              const content = (
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    !item.is_read && 'border-primary/30 bg-primary/5',
                    item.link_path && 'hover:bg-accent'
                  )}
                >
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
              );

              if (!item.link_path) {
                return (
                  <div key={item.id} onClick={() => !item.is_read && onMarkRead(item.id)}>
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.link_path}
                  onClick={() => !item.is_read && onMarkRead(item.id)}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
