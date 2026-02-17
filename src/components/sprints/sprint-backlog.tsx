'use client'

import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Badge } from '@/components/ui/badge'
import { PriorityIcon } from '@/components/issues/priority-badge'
import { ISSUE_TYPE_ICONS } from '@/lib/constants'
import type { Issue } from '@/types'

interface SprintBacklogProps {
  issues: Issue[]
  projectKey: string
}

export function SprintBacklog({ issues, projectKey }: SprintBacklogProps) {
  const totalPoints = issues.reduce(
    (sum, i) => sum + (i.story_points ?? 0),
    0
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-sm font-semibold">Backlog</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{issues.length} issues</span>
          {totalPoints > 0 && <span>{totalPoints} pts</span>}
        </div>
      </div>

      <Droppable droppableId="backlog">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[100px] ${
              snapshot.isDraggingOver ? 'bg-muted/30' : ''
            }`}
          >
            {issues.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No issues in backlog
              </p>
            )}
            {issues.map((issue, index) => (
              <Draggable
                key={issue.id}
                draggableId={issue.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`rounded-md border bg-background p-2 text-sm ${
                      snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <p className="font-medium text-sm leading-snug line-clamp-2">
                      {issue.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {projectKey}-{issue.issue_number}
                      </span>
                      <span>{ISSUE_TYPE_ICONS[issue.type]}</span>
                      <PriorityIcon priority={issue.priority} />
                      {issue.story_points != null && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[10px] font-mono"
                        >
                          {issue.story_points}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
