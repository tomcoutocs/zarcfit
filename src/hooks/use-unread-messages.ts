'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAuth } from '@/context/auth-context';

export function useUnreadMessageCount() {
  const { user, isTrainer } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setCount(0);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    async function fetchCount() {
      if (isTrainer) {
        const { data } = await supabase.rpc('get_trainer_dashboard_stats');
        const stats = data as { unread_messages?: number } | null;
        setCount(Number(stats?.unread_messages ?? 0));
      } else {
        const { data, error } = await supabase.rpc('get_client_unread_message_count', {
          p_client_id: userId,
        });
        if (error) {
          setCount(0);
          return;
        }
        setCount(Number(data ?? 0));
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    const channel = supabase
      .channel(`unread-messages-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCount)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, isTrainer]);

  return count;
}
