import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/actions/projects'
import { getTimeReportForProject } from '@/actions/time-entries'
import { TimeReport } from '@/components/time-tracking/time-report'

interface TimeReportPageProps {
  params: Promise<{ orgSlug: string; projectKey: string }>
}

export default async function TimeReportPage({ params }: TimeReportPageProps) {
  const { orgSlug, projectKey } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  const project = await getProject(org.id, projectKey)
  if (!project) notFound()

  const data = await getTimeReportForProject(project.id)

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Time Report</h2>
        <p className="text-sm text-muted-foreground">
          Time logged by team members across all issues.
        </p>
      </div>
      <TimeReport data={data} orgSlug={orgSlug} projectKey={projectKey} />
    </div>
  )
}
