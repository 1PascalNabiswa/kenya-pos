-- Add an explicit lifecycle flag so deactivated branches remain in history but leave active selectors.
ALTER TABLE branches
  ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE;
