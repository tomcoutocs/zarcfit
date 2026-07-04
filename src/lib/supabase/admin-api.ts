import { supabase } from '@/lib/supabase';

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
};

export type AdminStats = {
  total_users: number;
  total_admins: number;
  total_trainers: number;
  total_clients: number;
  total_blog_posts: number;
  published_blog_posts: number;
  active_trainer_client_pairs: number;
};

// Wraps the SECURITY DEFINER functions in admin-schema.sql. Each RPC call
// re-checks admin membership server-side, so there's no separate client-side
// authorization to worry about here beyond routing (see admin/layout.tsx).
export const adminApi = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase.rpc('get_all_users_for_admin');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  },

  setUserRole: async (userId: string, role: 'admin' | 'trainer' | 'client', action: 'grant' | 'revoke'): Promise<boolean> => {
    const { error } = await supabase.rpc('admin_set_user_role', {
      p_user_id: userId,
      p_role: role,
      p_action: action,
    });

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  },

  getStats: async (): Promise<AdminStats | null> => {
    const { data, error } = await supabase.rpc('get_admin_stats');

    if (error) {
      console.error('Error fetching admin stats:', error);
      return null;
    }

    return data?.[0] || null;
  },
};
