-- ============================================================================
-- ProjectFlow: Initial Schema Migration
-- A complete Jira-clone SaaS application database schema
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  email      TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- organizations
-- --------------------------------------------------------------------------
CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  owner_id   UUID NOT NULL REFERENCES profiles ON DELETE RESTRICT,
  plan       TEXT NOT NULL DEFAULT 'free'
               CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- organization_members
-- --------------------------------------------------------------------------
CREATE TABLE organization_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_email TEXT,
  invited_at    TIMESTAMPTZ,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- --------------------------------------------------------------------------
-- projects
-- --------------------------------------------------------------------------
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key         TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  created_by  UUID REFERENCES profiles ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

-- --------------------------------------------------------------------------
-- board_columns
-- --------------------------------------------------------------------------
CREATE TABLE board_columns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- issues
-- --------------------------------------------------------------------------
CREATE TABLE issues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  column_id    UUID REFERENCES board_columns ON DELETE SET NULL,
  issue_number INT NOT NULL,
  title        TEXT NOT NULL,
  description  JSONB,
  type         TEXT NOT NULL DEFAULT 'task'
                 CHECK (type IN ('task', 'bug', 'story', 'epic')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status       TEXT NOT NULL DEFAULT 'todo',
  assignee_id  UUID REFERENCES profiles ON DELETE SET NULL,
  reporter_id  UUID REFERENCES profiles ON DELETE SET NULL,
  due_date     DATE,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- labels
-- --------------------------------------------------------------------------
CREATE TABLE labels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- issue_labels
-- --------------------------------------------------------------------------
CREATE TABLE issue_labels (
  issue_id UUID NOT NULL REFERENCES issues ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);

-- --------------------------------------------------------------------------
-- comments
-- --------------------------------------------------------------------------
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES issues ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- activity_log
-- --------------------------------------------------------------------------
CREATE TABLE activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  project_id UUID REFERENCES projects ON DELETE SET NULL,
  issue_id   UUID REFERENCES issues ON DELETE SET NULL,
  user_id    UUID REFERENCES profiles ON DELETE SET NULL,
  action     TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- notifications
-- --------------------------------------------------------------------------
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  org_id     UUID REFERENCES organizations ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- super_admins
-- --------------------------------------------------------------------------
CREATE TABLE super_admins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES profiles ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- subscriptions
-- --------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL UNIQUE REFERENCES organizations ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'free'
                         CHECK (plan IN ('free', 'pro', 'enterprise')),
  status               TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. HELPER FUNCTIONS (used by RLS policies)
-- ============================================================================

-- Check if the current user is a member of a given organization
CREATE OR REPLACE FUNCTION is_org_member(_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the current user's role within a given organization
CREATE OR REPLACE FUNCTION get_user_org_role(_org_id UUID)
RETURNS TEXT AS $$
  SELECT role
  FROM organization_members
  WHERE org_id = _org_id
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM super_admins
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX idx_organization_members_org_id   ON organization_members (org_id);
CREATE INDEX idx_organization_members_user_id  ON organization_members (user_id);
CREATE INDEX idx_projects_org_id               ON projects (org_id);
CREATE INDEX idx_board_columns_project_id      ON board_columns (project_id);
CREATE INDEX idx_issues_project_id             ON issues (project_id);
CREATE INDEX idx_issues_column_id              ON issues (column_id);
CREATE INDEX idx_issues_assignee_id            ON issues (assignee_id);
CREATE INDEX idx_issues_reporter_id            ON issues (reporter_id);
CREATE INDEX idx_labels_project_id             ON labels (project_id);
CREATE INDEX idx_comments_issue_id             ON comments (issue_id);
CREATE INDEX idx_activity_log_org_id           ON activity_log (org_id);
CREATE INDEX idx_activity_log_project_id       ON activity_log (project_id);
CREATE INDEX idx_activity_log_issue_id         ON activity_log (issue_id);
CREATE INDEX idx_notifications_user_id         ON notifications (user_id);
CREATE INDEX idx_notifications_is_read         ON notifications (user_id, is_read);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- --------------------------------------------------------------------------
-- Auto-create a profile row when a new auth.users row is inserted
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- --------------------------------------------------------------------------
-- Auto-increment issue_number per project
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_issue_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.issue_number := COALESCE(
    (SELECT MAX(issue_number) FROM issues WHERE project_id = NEW.project_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_issue_number
  BEFORE INSERT ON issues
  FOR EACH ROW
  EXECUTE FUNCTION set_issue_number();

-- --------------------------------------------------------------------------
-- Generic updated_at trigger function
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_issues_updated_at
  BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels               ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_labels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- --------------------------------------------------------------------------
-- organizations
-- --------------------------------------------------------------------------
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (is_org_member(id));

CREATE POLICY organizations_update ON organizations
  FOR UPDATE USING (
    get_user_org_role(id) = 'owner'
  ) WITH CHECK (
    get_user_org_role(id) = 'owner'
  );

CREATE POLICY organizations_delete ON organizations
  FOR DELETE USING (
    get_user_org_role(id) = 'owner'
  );

CREATE POLICY organizations_insert ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- --------------------------------------------------------------------------
-- organization_members
-- --------------------------------------------------------------------------
CREATE POLICY org_members_select ON organization_members
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY org_members_insert ON organization_members
  FOR INSERT WITH CHECK (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );

CREATE POLICY org_members_update ON organization_members
  FOR UPDATE USING (
    get_user_org_role(org_id) IN ('owner', 'admin')
  ) WITH CHECK (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );

CREATE POLICY org_members_delete ON organization_members
  FOR DELETE USING (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );

-- --------------------------------------------------------------------------
-- projects
-- --------------------------------------------------------------------------
CREATE POLICY projects_select ON projects
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY projects_insert ON projects
  FOR INSERT WITH CHECK (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );

CREATE POLICY projects_update ON projects
  FOR UPDATE USING (
    get_user_org_role(org_id) IN ('owner', 'admin')
  ) WITH CHECK (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );

CREATE POLICY projects_delete ON projects
  FOR DELETE USING (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );

-- --------------------------------------------------------------------------
-- board_columns
-- --------------------------------------------------------------------------
CREATE POLICY board_columns_select ON board_columns
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = project_id))
  );

CREATE POLICY board_columns_insert ON board_columns
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

CREATE POLICY board_columns_update ON board_columns
  FOR UPDATE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  ) WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

CREATE POLICY board_columns_delete ON board_columns
  FOR DELETE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

-- --------------------------------------------------------------------------
-- issues
-- --------------------------------------------------------------------------
CREATE POLICY issues_select ON issues
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = project_id))
  );

CREATE POLICY issues_insert ON issues
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin', 'member')
  );

CREATE POLICY issues_update ON issues
  FOR UPDATE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin', 'member')
  ) WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin', 'member')
  );

-- --------------------------------------------------------------------------
-- labels
-- --------------------------------------------------------------------------
CREATE POLICY labels_select ON labels
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = project_id))
  );

CREATE POLICY labels_insert ON labels
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

CREATE POLICY labels_update ON labels
  FOR UPDATE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  ) WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

CREATE POLICY labels_delete ON labels
  FOR DELETE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

-- --------------------------------------------------------------------------
-- issue_labels
-- --------------------------------------------------------------------------
CREATE POLICY issue_labels_select ON issue_labels
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id)))
  );

CREATE POLICY issue_labels_insert ON issue_labels
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id))) IN ('owner', 'admin', 'member')
  );

CREATE POLICY issue_labels_delete ON issue_labels
  FOR DELETE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id))) IN ('owner', 'admin', 'member')
  );

-- --------------------------------------------------------------------------
-- comments
-- --------------------------------------------------------------------------
CREATE POLICY comments_select ON comments
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id)))
  );

CREATE POLICY comments_insert ON comments
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id))) IN ('owner', 'admin', 'member')
  );

CREATE POLICY comments_update ON comments
  FOR UPDATE USING (
    author_id = auth.uid()
  ) WITH CHECK (
    author_id = auth.uid()
  );

CREATE POLICY comments_delete ON comments
  FOR DELETE USING (
    author_id = auth.uid()
  );

-- --------------------------------------------------------------------------
-- activity_log
-- --------------------------------------------------------------------------
CREATE POLICY activity_log_select ON activity_log
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY activity_log_insert ON activity_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- --------------------------------------------------------------------------
-- notifications
-- --------------------------------------------------------------------------
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- super_admins
-- --------------------------------------------------------------------------
CREATE POLICY super_admins_select ON super_admins
  FOR SELECT USING (is_super_admin());

-- --------------------------------------------------------------------------
-- subscriptions
-- --------------------------------------------------------------------------
CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY subscriptions_update ON subscriptions
  FOR UPDATE USING (
    get_user_org_role(org_id) IN ('owner', 'admin')
  ) WITH CHECK (
    get_user_org_role(org_id) IN ('owner', 'admin')
  );
