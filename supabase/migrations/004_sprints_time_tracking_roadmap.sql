-- ============================================================================
-- ProjectFlow: Sprints, Time Tracking & Roadmap Migration
-- ============================================================================

-- --------------------------------------------------------------------------
-- sprints
-- --------------------------------------------------------------------------
CREATE TABLE sprints (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  name       TEXT NOT NULL,
  goal       TEXT,
  start_date DATE,
  end_date   DATE,
  status     TEXT NOT NULL DEFAULT 'planning'
               CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- time_entries
-- --------------------------------------------------------------------------
CREATE TABLE time_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id         UUID NOT NULL REFERENCES issues ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  description      TEXT,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- Alter issues table
-- --------------------------------------------------------------------------
ALTER TABLE issues
  ADD COLUMN sprint_id UUID REFERENCES sprints ON DELETE SET NULL;

ALTER TABLE issues
  ADD COLUMN story_points INT;

ALTER TABLE issues
  ADD COLUMN start_date DATE;

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------
CREATE INDEX idx_sprints_project_id ON sprints (project_id);
CREATE INDEX idx_sprints_status ON sprints (project_id, status);
CREATE INDEX idx_issues_sprint_id ON issues (sprint_id);
CREATE INDEX idx_time_entries_issue_id ON time_entries (issue_id);
CREATE INDEX idx_time_entries_user_id ON time_entries (user_id);
CREATE INDEX idx_time_entries_date ON time_entries (date);
CREATE INDEX idx_issues_roadmap ON issues (project_id, type) WHERE type = 'epic';

-- --------------------------------------------------------------------------
-- Triggers
-- --------------------------------------------------------------------------
CREATE TRIGGER trg_sprints_updated_at
  BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION enforce_single_active_sprint()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF EXISTS (
      SELECT 1 FROM sprints
      WHERE project_id = NEW.project_id
        AND status = 'active'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Only one sprint can be active per project at a time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_single_active_sprint
  BEFORE INSERT OR UPDATE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_active_sprint();

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- sprints
CREATE POLICY sprints_select ON sprints
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = project_id))
  );

CREATE POLICY sprints_insert ON sprints
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin', 'member')
  );

CREATE POLICY sprints_update ON sprints
  FOR UPDATE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin', 'member')
  ) WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin', 'member')
  );

CREATE POLICY sprints_delete ON sprints
  FOR DELETE USING (
    get_user_org_role((SELECT org_id FROM projects WHERE id = project_id)) IN ('owner', 'admin')
  );

-- time_entries
CREATE POLICY time_entries_select ON time_entries
  FOR SELECT USING (
    is_org_member((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id)))
  );

CREATE POLICY time_entries_insert ON time_entries
  FOR INSERT WITH CHECK (
    get_user_org_role((SELECT org_id FROM projects WHERE id = (SELECT project_id FROM issues WHERE id = issue_id))) IN ('owner', 'admin', 'member')
  );

CREATE POLICY time_entries_update ON time_entries
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY time_entries_delete ON time_entries
  FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- Disable RLS for development (matches 002_disable_rls.sql)
-- --------------------------------------------------------------------------
ALTER TABLE public.sprints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;
