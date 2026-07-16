import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export type ContactMessage = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
};

export const contactApi = {
  getAll: async (): Promise<ContactMessage[]> => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact messages:', error);
      return [];
    }
    return (data as ContactMessage[]) || [];
  },

  getById: async (id: string): Promise<ContactMessage | null> => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as ContactMessage;
  },

  updateStatus: async (id: string, status: ContactMessage['status']): Promise<boolean> => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    return !error;
  },

  getNewCount: async (): Promise<number> => {
    const supabase = createSupabaseBrowserClient();
    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    if (error) return 0;
    return count ?? 0;
  },
};
