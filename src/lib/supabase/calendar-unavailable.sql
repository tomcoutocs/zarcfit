-- ============================================
-- CALENDAR: unavailable days + meeting links
-- Run AFTER schema.sql and update-rls-policies.sql
-- Part of PF-303 / PF-305 (see IMPLEMENTATION_PLAN.md, Phase F)
-- ============================================

-- Allow a new 'unavailable' event_type, used by trainers to block out
-- days/ranges they can't be booked (all-day event, title "Unavailable").
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_event_type_check
  CHECK (event_type IN ('workout', 'coaching', 'nutrition', 'recovery', 'milestone', 'unavailable'));

-- Optional meeting link (Zoom / Google Meet / Calendly paste) shown to the
-- client on a coaching session. No OAuth — just a plain URL field.
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- Clients need to see when their trainer is unavailable so the session
-- request panel can block requests on those days. Scoped to only the
-- 'unavailable' event type so other trainer calendar entries stay private.
DROP POLICY IF EXISTS "Clients can view their trainers' unavailable blocks" ON calendar_events;
CREATE POLICY "Clients can view their trainers' unavailable blocks"
ON calendar_events FOR SELECT
USING (
  event_type = 'unavailable'
  AND EXISTS (
    SELECT 1 FROM trainer_clients tc
    WHERE tc.client_id = auth.uid()
    AND tc.trainer_id = calendar_events.user_id
    AND tc.status = 'active'
  )
);
