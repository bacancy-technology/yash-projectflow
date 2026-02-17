import Link from 'next/link'
import { format, isPast, isToday } from 'date-fns'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PriorityBadge } from '@/components/issues/priority-badge'
import { CalendarDays, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Issue, Project } from '@/types'

export interface AssignedIssue extends Issue {
  project?: Pick<Project, 'key' | 'org_id'> | null
  org_slug?: string
}

interface AssignedIssuesProps {
  issues: AssignedIssue[]
}

export function AssignedIssues({ issues }: AssignedIssuesProps) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned to You</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No issues are currently assigned to you.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assigned to You</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {issues.map((issue) => {
            const projectKey = issue.project?.key ?? 'PROJ'
            const actualProjectKey = issue.project?.key
            const orgSlug = issue.org_slug ?? ''
            const href =
              orgSlug && actualProjectKey
                ? `/org/${orgSlug}/projects/${actualProjectKey}/issues/${actualProjectKey}-${issue.issue_number}`
                : '#'

            const isOverdue =
              issue.due_date && isPast(new Date(issue.due_date)) && !isToday(new Date(issue.due_date))

            return (
              <Link
                key={issue.id}
                href={href}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {projectKey}-{issue.issue_number}
                  </Badge>
                  <span className="truncate text-sm font-medium">
                    {issue.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <PriorityBadge priority={issue.priority} />
                  {issue.due_date && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        isOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(issue.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
