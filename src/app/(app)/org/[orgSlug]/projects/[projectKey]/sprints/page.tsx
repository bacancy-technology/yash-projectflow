import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/actions/projects'
import { getSprints } from '@/actions/sprints'
import { SprintBoard } from '@/components/sprints/sprint-board'
import { Button } from '@/components/ui/button'
import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import { Lock } from 'lucide-react'
import type { Issue, Label, Profile, BoardColumn } from '@/types'

interface SprintsPageProps {
  params: Promise<{ orgSlug: string; projectKey: string }>
}

export default async function SprintsPage({ params }: SprintsPageProps) {
  const { orgSlug, projectKey } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  // Plan check
  const plan = (org.plan && org.plan in PLAN_LIMITS ? org.plan : 'free') as PlanType
  if (!PLAN_LIMITS[plan].sprints) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Sprints & Backlog</h2>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Sprint planning, backlog management, and velocity tracking are available on Pro and Enterprise plans.
        </p>
        <Link href={`/org/${orgSlug}/settings/billing`}>
          <Button>Upgrade Plan</Button>
        </Link>
      </div>
    )
  }

  const project = await getProject(org.id, projectKey)
  if (!project) notFound()

  const sprints = await getSprints(project.id)

  const { data: columns } = await supabase
    .from('board_columns')
    .select('*')
    .eq('project_id', project.id)
    .order('position', { ascending: true })

  const { data: issues } = await supabase
    .from('issues')
    .select(
      '*, assignee:profiles!issues_assignee_id_fkey(*), reporter:profiles!issues_reporter_id_fkey(*), issue_labels:issue_labels(label:labels(*))'
    )
    .eq('project_id', project.id)
    .order('position', { ascending: true })

  type IssueWithJoins = Issue & {
    issue_labels?: { label: Label | null }[] | null
  }

  const normalizedIssues: Issue[] = ((issues ?? []) as IssueWithJoins[]).map(
    ({ issue_labels, ...rest }) => ({
      ...rest,
      labels: (issue_labels ?? [])
        .map((row) => row.label)
        .filter((label): label is Label => !!label),
    })
  )

  const { data: members } = await supabase
    .from('organization_members')
    .select('profiles(*)')
    .eq('org_id', org.id)
    .not('accepted_at', 'is', null)

  type MemberWithProfile = { profiles: Profile | Profile[] | null }
  const memberProfiles: Profile[] = ((members ?? []) as MemberWithProfile[])
    .map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles))
    .filter((p): p is Profile => !!p)

  // Get "Done" column IDs for velocity tracking
  const doneColumnIds = (columns ?? [])
    .filter((c: BoardColumn) => c.name === 'Done')
    .map((c: BoardColumn) => c.id)

  return (
    <SprintBoard
      projectId={project.id}
      projectKey={projectKey}
      orgSlug={orgSlug}
      sprints={sprints}
      issues={normalizedIssues}
      columns={(columns ?? []) as BoardColumn[]}
      members={memberProfiles}
      doneColumnIds={doneColumnIds}
    />
  )
}
