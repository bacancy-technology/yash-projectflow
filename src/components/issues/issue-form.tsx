'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { createIssue, updateIssue } from '@/actions/issues'
import { ISSUE_TYPES, PRIORITIES, ISSUE_TYPE_ICONS, STORY_POINT_OPTIONS } from '@/lib/constants'
import type { BoardColumn, Issue, Profile } from '@/types'

const UNASSIGNED_VALUE = '__unassigned__'

interface IssueFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  columns: BoardColumn[]
  members: Profile[]
  issue?: Issue
  defaultColumnId?: string
  onSuccess?: () => void
}

export function IssueForm({
  open,
  onOpenChange,
  projectId,
  columns,
  members,
  issue,
  defaultColumnId,
  onSuccess,
}: IssueFormProps) {
  const isEdit = !!issue
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(issue?.title ?? '')
  const [description, setDescription] = useState<string>(
    typeof issue?.description === 'string' ? issue.description : ''
  )
  const [type, setType] = useState<Issue['type']>(issue?.type ?? 'task')
  const [priority, setPriority] = useState<Issue['priority']>(
    issue?.priority ?? 'medium'
  )
  const [assigneeId, setAssigneeId] = useState<string>(
    issue?.assignee_id ?? ''
  )
  const [columnId, setColumnId] = useState<string>(
    issue?.column_id ?? defaultColumnId ?? columns[0]?.id ?? ''
  )
  const [dueDate, setDueDate] = useState(issue?.due_date ?? '')
  const [storyPoints, setStoryPoints] = useState<string>(
    issue?.story_points != null ? String(issue.story_points) : ''
  )

  useEffect(() => {
    if (!open) return

    setError(null)
    setTitle(issue?.title ?? '')
    setDescription(typeof issue?.description === 'string' ? issue.description : '')
    setType(issue?.type ?? 'task')
    setPriority(issue?.priority ?? 'medium')
    setAssigneeId(issue?.assignee_id ?? '')
    setColumnId(issue?.column_id ?? defaultColumnId ?? columns[0]?.id ?? '')
    setDueDate(issue?.due_date ?? '')
    setStoryPoints(issue?.story_points != null ? String(issue.story_points) : '')
  }, [columns, defaultColumnId, issue, open])

  const normalizedDescription =
    description.trim() === '<p></p>' || description.trim() === '<p><br></p>'
      ? ''
      : description

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    try {
      const selectedColumn = columns.find((c) => c.id === columnId)
      if (isEdit && issue) {
        await updateIssue(issue.id, {
          title: title.trim(),
          description: normalizedDescription || null,
          type,
          priority,
          assignee_id: assigneeId || null,
          column_id: columnId,
          status: selectedColumn?.name ?? issue.status,
          due_date: dueDate || null,
          story_points: storyPoints ? Number(storyPoints) : null,
        })
      } else {
        await createIssue(projectId, columnId, {
          title: title.trim(),
          description: normalizedDescription || null,
          type,
          priority,
          assignee_id: assigneeId || null,
          due_date: dueDate || null,
          story_points: storyPoints ? Number(storyPoints) : null,
        })
      }

      // Reset form
      setTitle('')
      setDescription('')
      setType('task')
      setPriority('medium')
      setAssigneeId('')
      setDueDate('')
      setStoryPoints('')

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Issue' : 'Create Issue'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid flex-1 gap-6 md:grid-cols-[1fr_280px] overflow-y-auto pr-1"
        >
          {error && (
            <div className="md:col-span-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={normalizedDescription}
                onChange={setDescription}
                placeholder="Add a description…"
              />
            </div>
          </div>

          <div className="space-y-4 md:border-l md:pl-6">
            <p className="text-xs font-semibold text-muted-foreground">Details</p>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as Issue['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span>{ISSUE_TYPE_ICONS[t]}</span>
                        <span className="capitalize">{t}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Issue['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="capitalize">{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={assigneeId || UNASSIGNED_VALUE}
                onValueChange={(value) =>
                  setAssigneeId(value === UNASSIGNED_VALUE ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name ?? member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status / Column</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Story Points</Label>
              <Select
                value={storyPoints || '__none__'}
                onValueChange={(v) => setStoryPoints(v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {STORY_POINT_OPTIONS.map((sp) => (
                    <SelectItem key={sp} value={String(sp)}>
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
