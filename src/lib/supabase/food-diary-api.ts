import { supabase } from '../supabase';

export type FoodDiaryEntry = {
  id?: string;
  user_id: string;
  logged_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  serving_description?: string;
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  fatsecret_food_id?: string;
  notes?: string;
  created_at?: string;
};

export const foodDiaryApi = {
  getEntriesForDate: async (userId: string, date: string): Promise<FoodDiaryEntry[]> => {
    const { data, error } = await supabase
      .from('food_diary_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching food diary:', error);
      return [];
    }
    return data || [];
  },

  createEntry: async (entry: FoodDiaryEntry): Promise<FoodDiaryEntry | null> => {
    const { data, error } = await supabase
      .from('food_diary_entries')
      .insert([entry])
      .select()
      .single();

    if (error) {
      console.error('Error creating food diary entry:', error);
      return null;
    }
    return data;
  },

  deleteEntry: async (entryId: string): Promise<boolean> => {
    const { error } = await supabase.from('food_diary_entries').delete().eq('id', entryId);
    if (error) {
      console.error('Error deleting food diary entry:', error);
      return false;
    }
    return true;
  },
};
