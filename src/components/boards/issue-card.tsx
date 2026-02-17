'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PriorityIcon } from '@/components/issues/priority-badge'
import { ISSUE_TYPE_ICONS, ISSUE_TYPE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'
import type { Issue, Label } from '@/types'

interface IssueCardProps {
  issue: Issue
  index: number
  orgSlug: string
  projectKey: string
  onOpenIssue?: (issue: Issue) => void
}

export function IssueCard({
  issue,
  index,
  orgSlug,
  projectKey,
  onOpenIssue,
}: IssueCardProps) {
  const issueKey = `${projectKey}-${issue.issue_number}`

  const handleClick = () => {
    if (onOpenIssue) {
      onOpenIssue(issue)
      return
    }
    window.location.href = `/org/${orgSlug}/projects/${projectKey}/issues/${issueKey}`
  }

  const assigneeInitials = issue.assignee?.full_name
    ? issue.assignee.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null

  const isOverdue =
    issue.due_date && new Date(issue.due_date) < new Date()

  const borderColor = ISSUE_TYPE_COLORS[issue.type] ?? '#4B89DC'

  const labels = (issue.labels ?? []) as Label[]
  const visibleLabels = labels.slice(0, 2)
  const extraLabelCount = Math.max(0, labels.length - visibleLabels.length)

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div
            onClick={handleClick}
            className={cn(
              'group cursor-pointer rounded-lg border border-border/60 bg-background p-3 shadow-sm transition-shadow hover:shadow-md',
              snapshot.isDragging && 'rotate-1 shadow-lg ring-2 ring-primary/20'
            )}
            style={{ borderLeft: `4px solid ${borderColor}` }}
          >
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {issue.title}
            </p>

            {visibleLabels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {visibleLabels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ borderColor: label.color, color: label.color }}
                    title={label.name}
                  >
                    {label.name}
                  </span>
                ))}
                {extraLabelCount > 0 && (
                  <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    +{extraLabelCount}
                  </span>
                )}
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {issueKey}
                </span>
                <span className="text-xs" title={issue.type}>
                  {ISSUE_TYPE_ICONS[issue.type]}
                </span>
                <PriorityIcon priority={issue.priority} />
                {issue.story_points != null && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-primary/10 text-[10px] font-semibold text-primary px-1">
                    {issue.story_points}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {issue.due_date && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] text-muted-foreground',
                      isOverdue && 'border-red-500/40 text-red-600'
                    )}
                  >
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(issue.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}

                {issue.assignee ? (
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={issue.assignee.avatar_url ?? undefined}
                      alt={issue.assignee.full_name ?? ''}
                    />
                    <AvatarFallback className="text-[9px]">
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="text-[10px] text-muted-foreground/70">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
