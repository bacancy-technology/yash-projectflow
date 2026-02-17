import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/actions/projects'
import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import { RoadmapTimeline } from '@/components/roadmap/roadmap-timeline'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { Issue, Profile } from '@/types'

interface TimelinePageProps {
  params: Promise<{ orgSlug: string; projectKey: string }>
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { orgSlug, projectKey } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  const plan = (org.plan ?? 'free') as PlanType
  if (!PLAN_LIMITS[plan]?.roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Roadmap &amp; Timeline</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Visualize your epics on a timeline to plan and track long-term goals.
          Upgrade to Pro to unlock this feature.
        </p>
        <Button asChild>
          <Link href={`/org/${orgSlug}/settings/billing`}>Upgrade to Pro</Link>
        </Button>
      </div>
    )
  }

  const project = await getProject(org.id, projectKey)
  if (!project) notFound()

  const { data: epics } = await supabase
    .from('issues')
    .select('*, assignee:profiles!issues_assignee_id_fkey(*)')
    .eq('project_id', project.id)
    .eq('type', 'epic')
    .order('created_at', { ascending: true })

  const { data: members } = await supabase
    .from('organization_members')
    .select('profiles(*)')
    .eq('org_id', org.id)
    .not('accepted_at', 'is', null)

  type MemberWithProfile = { profiles: Profile | Profile[] | null }
  const memberProfiles: Profile[] = ((members ?? []) as MemberWithProfile[])
    .map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles))
    .filter((p): p is Profile => !!p)

  return (
    <RoadmapTimeline
      epics={(epics ?? []) as Issue[]}
      members={memberProfiles}
    />
  )
}
