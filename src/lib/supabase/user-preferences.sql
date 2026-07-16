-- User preferences: notifications, privacy, units (ZF-609, ZF-610, ZF-611)
-- Safe to re-run

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_workouts": true,
  "email_messages": true,
  "email_sessions": true,
  "push_enabled": false
}'::jsonb;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visible_to_trainer": true,
  "share_progress_photos": true
}'::jsonb;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS unit_preferences JSONB DEFAULT '{
  "weight": "lb",
  "height": "ft",
  "week_starts_on": 0
}'::jsonb;
