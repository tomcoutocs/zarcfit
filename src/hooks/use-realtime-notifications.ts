'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAuth } from '@/context/auth-context';
import { notificationsApi, type UserNotification } from '@/lib/supabase/trainer-api';

export function useRealtimeNotifications(limit = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const [items, count] = await Promise.all([
      notificationsApi.getNotifications(limit),
      notificationsApi.getUnreadCount(),
    ]);
    setNotifications(items);
    setUnreadCount(count);
    setLoading(false);
  }, [user?.id, limit]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    refresh();
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  return { notifications, unreadCount, loading, refresh };
}
