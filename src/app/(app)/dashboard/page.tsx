import { createClient } from '@/lib/supabase/server'
import { getUserOrgs } from '@/actions/organizations'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatsCards, type DashboardStats } from '@/components/dashboard/stats-cards'
import { AssignedIssues, type AssignedIssue } from '@/components/dashboard/assigned-issues'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Bell, Building2, ArrowRight } from 'lucide-react'
import { startOfWeek } from 'date-fns'
import type { ActivityLog, Issue, Organization } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's organizations
  const orgs = await getUserOrgs()
  const orgIds = orgs.map((o) => o.id)

  // Build a map from org_id -> slug for quick lookup
  const orgSlugMap = new Map<string, string>(orgs.map((o) => [o.id, o.slug]))

  const stats: DashboardStats = {
    totalProjects: 0,
    openIssues: 0,
    completedThisWeek: 0,
    overdueIssues: 0,
  }
  let assignedIssues: AssignedIssue[] = []
  let recentActivities: ActivityLog[] = []

  if (orgIds.length > 0) {
    // Get all projects across user's orgs
    const { data: projects } = await supabase
      .from('projects')
      .select('id, key, org_id')
      .in('org_id', orgIds)

    const projectIds = projects?.map((p) => p.id) ?? []
    const projectMap = new Map(
      (projects ?? []).map((p) => [p.id, { key: p.key, org_id: p.org_id }])
    )

    stats.totalProjects = projects?.length ?? 0

    if (projectIds.length > 0) {
      // Get "Done" columns to identify completed issues
      const { data: doneColumns } = await supabase
        .from('board_columns')
        .select('id, project_id')
        .in('project_id', projectIds)
        .eq('name', 'Done')

      const doneColumnIds = doneColumns?.map((c) => c.id) ?? []

      // Count open issues (not in Done columns)
      const { count: openCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .not('column_id', 'in', doneColumnIds.length > 0 ? `(${doneColumnIds.join(',')})` : '()')

      stats.openIssues = openCount ?? 0

      // Completed this week
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
      if (doneColumnIds.length > 0) {
        const { count: completedCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .in('column_id', doneColumnIds)
          .gte('updated_at', weekStart)

        stats.completedThisWeek = completedCount ?? 0
      }

      // Overdue issues (not done, past due date)
      const now = new Date().toISOString()
      const { count: overdueCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .not('column_id', 'in', doneColumnIds.length > 0 ? `(${doneColumnIds.join(',')})` : '()')
        .lt('due_date', now)
        .not('due_date', 'is', null)

      stats.overdueIssues = overdueCount ?? 0

      // Assigned issues for current user
      const { data: myIssues } = await supabase
        .from('issues')
        .select('*')
        .eq('assignee_id', user.id)
        .in('project_id', projectIds)
        .not('column_id', 'in', doneColumnIds.length > 0 ? `(${doneColumnIds.join(',')})` : '()')
        .order('updated_at', { ascending: false })
        .limit(10)

      assignedIssues = (myIssues ?? []).map((issue: Issue) => {
        const proj = projectMap.get(issue.project_id)
        return {
          ...issue,
          project: proj ? { key: proj.key, org_id: proj.org_id } : null,
          org_slug: proj ? orgSlugMap.get(proj.org_id) ?? '' : '',
        }
      })
    }

    // Recent activity across all orgs
    const { data: activities } = await supabase
      .from('activity_log')
      .select('*, user:profiles!user_id(*)')
      .in('org_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(10)

    recentActivities = (activities as ActivityLog[]) ?? []
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome + Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here is an overview of your projects and tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications">
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              View Notifications
            </Button>
          </Link>
        </div>
      </div>

      {/* No organization banner */}
      {orgs.length === 0 && (
        <div className="rounded-lg border bg-muted/50 p-6">
          <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:text-left sm:space-y-0 sm:space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Create your first organization</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Organizations are where your projects, issues, and team members live. Create one to get started.
              </p>
            </div>
            <Link href="/org/new">
              <Button className="gap-2">
                Create Organization
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Assigned Issues + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssignedIssues issues={assignedIssues} />
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  )
}
