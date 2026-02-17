export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_id: string
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  profiles?: Profile
}

export interface Project {
  id: string
  org_id: string
  name: string
  key: string
  description: string | null
  icon: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface BoardColumn {
  id: string
  project_id: string
  name: string
  color: string | null
  position: number
  created_at: string
}

export interface Issue {
  id: string
  project_id: string
  column_id: string
  issue_number: number
  title: string
  description: unknown | null
  type: 'task' | 'bug' | 'story' | 'epic'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: string
  assignee_id: string | null
  reporter_id: string | null
  due_date: string | null
  start_date: string | null
  sprint_id: string | null
  story_points: number | null
  position: number
  created_at: string
  updated_at: string
  assignee?: Profile | null
  reporter?: Profile | null
  labels?: Label[]
}

export interface Label {
  id: string
  project_id: string
  name: string
  color: string
  created_at: string
}

export interface IssueLabel {
  issue_id: string
  label_id: string
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string
  content: unknown
  created_at: string
  updated_at: string
  author?: Profile
}

export interface ActivityLog {
  id: string
  org_id: string
  project_id: string | null
  issue_id: string | null
  user_id: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

export interface Notification {
  id: string
  user_id: string
  org_id: string | null
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export interface Subscription {
  id: string
  org_id: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface SuperAdmin {
  id: string
  user_id: string
  created_at: string
}

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'active' | 'completed'
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  issue_id: string
  user_id: string
  duration_minutes: number
  description: string | null
  date: string
  created_at: string
  user?: Profile
}

export interface BoardColumnWithIssues extends BoardColumn {
  issues: Issue[]
}
