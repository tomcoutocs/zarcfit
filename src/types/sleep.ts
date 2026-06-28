export interface SleepRecord {
  id: string;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration: number; // in minutes
  quality: number; // 1-5 scale
  notes?: string;
  disruptions?: number;
  deep_sleep?: number;
  light_sleep?: number;
  rem_sleep?: number;
  created_at: string;
  updated_at: string;
} 