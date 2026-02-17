'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SprintForm } from './sprint-form'
import { SprintBacklog } from './sprint-backlog'
import { SprintCompleteDialog } from './sprint-complete-dialog'
import { SprintVelocityCard } from './sprint-velocity-card'
import { SprintCard } from './sprint-card'
import { BoardColumn } from '@/components/boards/board-column'
import {
  assignIssueToSprint,
  startSprint,
} from '@/actions/sprints'
import { moveIssue } from '@/actions/issues'
import { Plus, Play, CheckCircle2 } from 'lucide-react'
import type {
  Sprint,
  Issue,
  BoardColumn as BoardColumnType,
  Profile,
  BoardColumnWithIssues,
} from '@/types'

interface SprintBoardProps {
  projectId: string
  projectKey: string
  orgSlug: string
  sprints: Sprint[]
  issues: Issue[]
  columns: BoardColumnType[]
  members: Profile[]
  doneColumnIds: string[]
}

export function SprintBoard({
  projectId,
  projectKey,
  orgSlug,
  sprints,
  issues,
  columns,
  members,
  doneColumnIds,
}: SprintBoardProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string>(() => {
    const active = sprints.find((s) => s.status === 'active')
    return active?.id ?? ''
  })

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)

  const backlogIssues = useMemo(
    () =>
      issues
        .filter((i) => !i.sprint_id)
        .sort((a, b) => a.position - b.position),
    [issues]
  )

  const sprintIssues = useMemo(
    () =>
      selectedSprint
        ? issues
            .filter((i) => i.sprint_id === selectedSprint.id)
            .sort((a, b) => a.position - b.position)
        : [],
    [issues, selectedSprint]
  )

  const incompleteCount = useMemo(() => {
    if (!selectedSprint) return 0
    return sprintIssues.filter(
      (i) => !doneColumnIds.includes(i.column_id)
    ).length
  }, [sprintIssues, selectedSprint, doneColumnIds])

  const hasNextSprint = sprints.some((s) => s.status === 'planning')

  const columnsWithIssues: BoardColumnWithIssues[] = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        issues: sprintIssues.filter((i) => i.column_id === col.id),
      })),
    [columns, sprintIssues]
  )

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    const fromBacklog = source.droppableId === 'backlog'
    const toBacklog = destination.droppableId === 'backlog'

    if (fromBacklog && !toBacklog && selectedSprint) {
      // Move from backlog to sprint column
      await assignIssueToSprint(draggableId, selectedSprint.id)
      const targetColumnId = destination.droppableId
      await moveIssue(draggableId, targetColumnId, destination.index)
      router.refresh()
    } else if (!fromBacklog && toBacklog) {
      // Move from sprint to backlog
      await assignIssueToSprint(draggableId, null)
      router.refresh()
    } else if (!fromBacklog && !toBacklog) {
      // Move within sprint columns
      if (source.droppableId !== destination.droppableId) {
        await moveIssue(draggableId, destination.droppableId, destination.index)
        router.refresh()
      }
    }
  }

  const handleStartSprint = async () => {
    if (!selectedSprint) return
    try {
      await startSprint(selectedSprint.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to start sprint:', error)
    }
  }

  // If no sprints exist, show a prompt
  if (sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground text-sm">
          No sprints yet. Create your first sprint to get started.
        </p>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Sprint
        </Button>
        <SprintForm
          open={formOpen}
          onOpenChange={setFormOpen}
          projectId={projectId}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Select
            value={selectedSprintId}
            onValueChange={setSelectedSprintId}
          >
            <SelectTrigger className="w-[200px] h-8 text-sm">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    {s.name}
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {s.status}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSprint?.status === 'planning' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={handleStartSprint}
            >
              <Play className="h-3 w-3" />
              Start Sprint
            </Button>
          )}

          {selectedSprint?.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setCompleteOpen(true)}
            >
              <CheckCircle2 className="h-3 w-3" />
              Complete Sprint
            </Button>
          )}
        </div>

        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="h-3 w-3" />
          New Sprint
        </Button>
      </div>

      {/* Velocity */}
      <div className="px-3 py-2 border-b">
        <SprintVelocityCard
          sprints={sprints}
          issues={issues}
          doneColumnIds={doneColumnIds}
        />
      </div>

      {/* Board + Backlog */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sprint Board */}
          <div className="flex-1 flex gap-3 overflow-x-auto p-3">
            {selectedSprint ? (
              columnsWithIssues.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  orgSlug={orgSlug}
                  projectKey={projectKey}
                  onAddIssue={() => {}}
                  onOpenIssue={(issue) => {
                    window.location.href = `/org/${orgSlug}/projects/${projectKey}/issues/${projectKey}-${issue.issue_number}`
                  }}
                />
              ))
            ) : (
              <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
                Select a sprint to view its board
              </div>
            )}
          </div>

          {/* Backlog */}
          <div className="w-72 shrink-0 border-l">
            <SprintBacklog
              issues={backlogIssues}
              projectKey={projectKey}
            />
          </div>
        </div>
      </DragDropContext>

      {/* Dialogs */}
      <SprintForm
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
      />

      {selectedSprint && (
        <SprintCompleteDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          sprint={selectedSprint}
          incompleteCount={incompleteCount}
          hasNextSprint={hasNextSprint}
        />
      )}
    </div>
  )
}
