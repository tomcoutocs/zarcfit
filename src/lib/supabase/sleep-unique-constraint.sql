-- Sleep tracking: one record per user per date (ZF-503)
-- Safe to re-run

-- Remove duplicates, keeping the most recently updated row
DELETE FROM sleep_tracking a
USING sleep_tracking b
WHERE a.user_id = b.user_id
  AND a.date = b.date
  AND a.updated_at < b.updated_at;

DELETE FROM sleep_tracking a
USING sleep_tracking b
WHERE a.user_id = b.user_id
  AND a.date = b.date
  AND a.id < b.id
  AND a.updated_at = b.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_tracking_user_date
ON sleep_tracking (user_id, date);
