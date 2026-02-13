-- Add 'bbb' to meeting_provider constraint
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_meeting_provider_check;
ALTER TABLE classes ADD CONSTRAINT classes_meeting_provider_check
  CHECK (meeting_provider IN ('100ms', 'zoom', 'meet', 'jitsi', 'bbb'));
