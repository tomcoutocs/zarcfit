-- ============================================
-- CONTACT MESSAGES
-- Backs the public contact form at /main/contact
-- ============================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('new', 'read', 'archived')) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit a message, but can never
-- read, update, or delete messages back out through the anon/public API.
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON contact_messages;
CREATE POLICY "Anyone can submit a contact message"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- Only admins can review submitted messages.
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
CREATE POLICY "Admins can view contact messages"
ON contact_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
CREATE POLICY "Admins can update contact messages"
ON contact_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);
