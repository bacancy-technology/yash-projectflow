'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd'
import { BoardColumn } from './board-column'
import { CreateColumnDialog } from '@/components/boards/create-column-dialog'
import { IssueForm } from '@/components/issues/issue-form'
import { IssueFilters, type FilterState } from '@/components/issues/issue-filters'
import { moveIssue, reorderIssue } from '@/actions/issues'
import { useRealtimeIssues } from '@/hooks/use-realtime'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useOrg } from '@/hooks/use-org'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BoardColumnWithIssues, Issue, Profile } from '@/types'

interface KanbanBoardProps {
  columns: BoardColumnWithIssues[]
  projectId: string
  orgSlug: string
  projectKey: string
  members: Profile[]
}

export function KanbanBoard({
  columns: initialColumns,
  projectId,
  orgSlug,
  projectKey,
  members,
}: KanbanBoardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [columns, setColumns] = useState(initialColumns)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const { memberRole } = useOrg()
  const canManageColumns = memberRole === 'owner' || memberRole === 'admin'

  // Support opening the issue form via URL (?new=1)
  useEffect(() => {
    if (searchParams.get('new') !== '1') return

    setActiveIssue(null)
    setActiveColumnId(null)
    setShowIssueForm(true)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('new')
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [pathname, router, searchParams])

  // Apply filters to columns
  const filteredColumns = columns.map((col) => ({
    ...col,
    issues: col.issues.filter((issue) => {
      if (filters.type && filters.type.length > 0 && !filters.type.includes(issue.type)) {
        return false
      }
      if (
        filters.priority &&
        filters.priority.length > 0 &&
        !filters.priority.includes(issue.priority)
      ) {
        return false
      }
      if (filters.assignee_id && issue.assignee_id !== filters.assignee_id) {
        return false
      }
      if (
        filters.search &&
        !issue.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }
      return true
    }),
  }))

  // Realtime updates
  useRealtimeIssues(projectId, useCallback(() => {
    router.refresh()
  }, [router]))

  // Sync with server data when props change
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const sourceColIndex = columns.findIndex(
      (c) => c.id === source.droppableId
    )
    const destColIndex = columns.findIndex(
      (c) => c.id === destination.droppableId
    )

    if (sourceColIndex === -1 || destColIndex === -1) return

    // Optimistic update
    const newColumns = columns.map((col) => ({
      ...col,
      issues: [...col.issues],
    }))

    const sourceCol = newColumns[sourceColIndex]
    const destCol = newColumns[destColIndex]

    // Remove from source
    const sortedSourceIssues = sourceCol.issues.sort(
      (a, b) => a.position - b.position
    )
    const [movedIssue] = sortedSourceIssues.splice(source.index, 1)

    if (!movedIssue) return

    if (source.droppableId === destination.droppableId) {
      // Reorder within column
      sortedSourceIssues.splice(destination.index, 0, {
        ...movedIssue,
        position: destination.index,
      })

      // Update positions
      sortedSourceIssues.forEach((issue, i) => {
        issue.position = i
      })

      sourceCol.issues = sortedSourceIssues
      setColumns(newColumns)

      try {
        await reorderIssue(draggableId, destination.index)
      } catch (error) {
        console.error('Failed to reorder issue:', error)
        setColumns(initialColumns)
      }
    } else {
      // Move to different column
      const sortedDestIssues = destCol.issues.sort(
        (a, b) => a.position - b.position
      )

      sortedDestIssues.splice(destination.index, 0, {
        ...movedIssue,
        column_id: destination.droppableId,
        status: destCol.name,
        position: destination.index,
      })

      // Update positions
      sortedSourceIssues.forEach((issue, i) => {
        issue.position = i
      })
      sortedDestIssues.forEach((issue, i) => {
        issue.position = i
      })

      sourceCol.issues = sortedSourceIssues
      destCol.issues = sortedDestIssues
      setColumns(newColumns)

      try {
        await moveIssue(draggableId, destination.droppableId, destination.index)
      } catch (error) {
        console.error('Failed to move issue:', error)
        setColumns(initialColumns)
      }
    }
  }

  const handleAddIssue = (columnId: string) => {
    setActiveIssue(null)
    setActiveColumnId(columnId)
    setShowIssueForm(true)
  }

  const handleIssueSaved = () => {
    setShowIssueForm(false)
    setActiveColumnId(null)
    setActiveIssue(null)
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-muted/20 shadow-sm">
      <IssueFilters members={members} onChange={setFilters} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 min-h-0 items-start gap-4 overflow-x-auto p-4">
          {filteredColumns
            .sort((a, b) => a.position - b.position)
            .map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                orgSlug={orgSlug}
                projectKey={projectKey}
                onAddIssue={handleAddIssue}
                onOpenIssue={(issue) => {
                  setActiveIssue(issue)
                  setActiveColumnId(null)
                  setShowIssueForm(true)
                }}
              />
            ))}

          {canManageColumns && (
            <div className="flex h-full w-[272px] min-w-[272px] items-start">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2 border-dashed bg-background/40 hover:bg-background"
                onClick={() => setShowColumnDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Add column
              </Button>
            </div>
          )}
        </div>
      </DragDropContext>

      <IssueForm
        open={showIssueForm}
        onOpenChange={(open) => {
          setShowIssueForm(open)
          if (!open) {
            setActiveIssue(null)
            setActiveColumnId(null)
          }
        }}
        projectId={projectId}
        columns={columns}
        members={members}
        issue={activeIssue ?? undefined}
        defaultColumnId={activeIssue?.column_id ?? activeColumnId ?? undefined}
        onSuccess={handleIssueSaved}
      />

      <CreateColumnDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        projectId={projectId}
      />
    </div>
  )
}
