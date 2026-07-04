-- ============================================
-- APPLE HEALTH / WEARABLE IMPORT KEYS
-- Run AFTER schema.sql
-- ============================================

CREATE TABLE IF NOT EXISTS health_import_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE health_import_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own health import keys"
ON health_import_keys FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION get_or_create_health_import_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT api_key INTO v_key FROM health_import_keys WHERE user_id = auth.uid();
  IF v_key IS NOT NULL THEN
    RETURN v_key;
  END IF;

  INSERT INTO health_import_keys (user_id) VALUES (auth.uid())
  RETURNING api_key INTO v_key;

  RETURN v_key;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_health_import_key() TO authenticated;
