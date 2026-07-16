-- Session request notification triggers (ZF-404)
-- Safe to re-run

CREATE OR REPLACE FUNCTION notify_session_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO user_notifications (user_id, type, title, body, link_path)
      VALUES (
        NEW.client_id,
        'session',
        'Session approved',
        'Your session request was approved',
        '/client/calendar'
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO user_notifications (user_id, type, title, body, link_path)
      VALUES (
        NEW.client_id,
        'session',
        'Session declined',
        'Your session request was declined',
        '/client/calendar'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_session_request_status_notify ON session_requests;
CREATE TRIGGER on_session_request_status_notify
AFTER UPDATE ON session_requests
FOR EACH ROW
EXECUTE FUNCTION notify_session_request_status();
