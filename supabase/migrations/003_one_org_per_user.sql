-- Enforce one organization per user (owner)
ALTER TABLE organizations ADD CONSTRAINT organizations_owner_id_unique UNIQUE (owner_id);
