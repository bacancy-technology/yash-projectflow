'use client'

import { Droppable } from '@hello-pangea/dnd'
import { IssueCard } from './issue-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BoardColumnWithIssues, Issue } from '@/types'

interface BoardColumnProps {
  column: BoardColumnWithIssues
  orgSlug: string
  projectKey: string
  onAddIssue: (columnId: string) => void
  onOpenIssue: (issue: Issue) => void
}

export function BoardColumn({
  column,
  orgSlug,
  projectKey,
  onAddIssue,
  onOpenIssue,
}: BoardColumnProps) {
  return (
    <div className="flex h-full w-[272px] min-w-[272px] flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-sm">
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: column.color ?? '#6B7280' }}
          />
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {column.name}
          </h3>
          <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {column.issues.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md hover:bg-background/70"
          onClick={() => onAddIssue(column.id)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin transition-colors',
              snapshot.isDraggingOver && 'bg-primary/5'
            )}
          >
            {column.issues
              .sort((a, b) => a.position - b.position)
              .map((issue, index) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  index={index}
                  orgSlug={orgSlug}
                  projectKey={projectKey}
                  onOpenIssue={onOpenIssue}
                />
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
