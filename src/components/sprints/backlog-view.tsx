'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IssueFilters, type FilterState } from '@/components/issues/issue-filters'
import { IssueForm } from '@/components/issues/issue-form'
import { PriorityIcon } from '@/components/issues/priority-badge'
import { ISSUE_TYPE_ICONS } from '@/lib/constants'
import { assignIssueToSprint } from '@/actions/sprints'
import { Inbox, Plus } from 'lucide-react'
import type { BoardColumn, Issue, Profile, Sprint } from '@/types'

interface BacklogViewProps {
  issues: Issue[]
  members: Profile[]
  sprints: Sprint[]
  columns: BoardColumn[]
  projectId: string
  projectKey: string
  orgSlug: string
}

export function BacklogView({
  issues,
  members,
  sprints,
  columns,
  projectId,
  projectKey,
  orgSlug,
}: BacklogViewProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>({})
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const activeSprints = sprints.filter((s) => s.status !== 'completed')

  const filteredIssues = issues.filter((issue) => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !issue.title.toLowerCase().includes(q) &&
        !`${projectKey}-${issue.issue_number}`.toLowerCase().includes(q)
      )
        return false
    }
    if (filters.type && filters.type.length > 0 && !filters.type.includes(issue.type))
      return false
    if (
      filters.priority &&
      filters.priority.length > 0 &&
      !filters.priority.includes(issue.priority)
    )
      return false
    if (filters.assignee_id && issue.assignee_id !== filters.assignee_id)
      return false
    return true
  })

  const totalPoints = filteredIssues.reduce(
    (sum, i) => sum + (i.story_points ?? 0),
    0
  )

  function handleAssignToSprint(issueId: string, sprintId: string) {
    startTransition(async () => {
      await assignIssueToSprint(issueId, sprintId)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-0">
      <IssueFilters members={members} onChange={setFilters} />

      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Backlog</h2>
          <span className="text-xs text-muted-foreground">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            {totalPoints > 0 && ` · ${totalPoints} pts`}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="size-3.5 mr-1.5" />
          Create Issue
        </Button>
      </div>

      <IssueForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        projectId={projectId}
        columns={columns}
        members={members}
        onSuccess={() => {
          setShowCreateForm(false)
          router.refresh()
        }}
      />

      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No issues in backlog</p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-sm"
            >
              <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                {projectKey}-{issue.issue_number}
              </span>
              <span className="shrink-0">{ISSUE_TYPE_ICONS[issue.type]}</span>
              <span
                className="flex-1 truncate cursor-pointer hover:underline"
                onClick={() =>
                  router.push(
                    `/org/${orgSlug}/projects/${projectKey}/issues/${issue.issue_number}`
                  )
                }
              >
                {issue.title}
              </span>
              <PriorityIcon priority={issue.priority} />
              {issue.story_points != null && (
                <Badge
                  variant="outline"
                  className="h-5 px-1.5 text-[10px] font-mono shrink-0"
                >
                  {issue.story_points}
                </Badge>
              )}
              {issue.assignee && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px] shrink-0">
                  {issue.assignee.full_name ?? issue.assignee.email}
                </span>
              )}
              {issue.due_date && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(issue.due_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {activeSprints.length > 0 && (
                <Select
                  onValueChange={(sprintId) =>
                    handleAssignToSprint(issue.id, sprintId)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="h-7 w-[140px] text-xs shrink-0">
                    <SelectValue placeholder="Add to sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
