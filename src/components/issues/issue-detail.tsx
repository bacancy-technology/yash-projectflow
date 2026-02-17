'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateIssue, deleteIssue, type IssueUpdate } from '@/actions/issues'
import {
  ISSUE_TYPES,
  PRIORITIES,
  ISSUE_TYPE_ICONS,
  STORY_POINT_OPTIONS,
} from '@/lib/constants'
import {
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import type { Issue, BoardColumn, Profile, Label, Comment, Sprint } from '@/types'

const UNASSIGNED_VALUE = '__unassigned__'
const NO_SPRINT_VALUE = '__no_sprint__'

interface IssueDetailProps {
  issue: Issue & {
    comments?: Comment[]
    labels?: Label[]
  }
  columns: BoardColumn[]
  members: Profile[]
  projectLabels: Label[]
  projectKey: string
  orgSlug: string
  sprints?: Sprint[]
}

export function IssueDetail({
  issue,
  columns,
  members,
  projectLabels,
  projectKey,
  orgSlug,
  sprints = [],
}: IssueDetailProps) {
  const router = useRouter()
  const issueKey = `${projectKey}-${issue.issue_number}`
  const issueDescription =
    typeof issue.description === 'string' ? issue.description : ''

  // Editable title
  const [title, setTitle] = useState(issue.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Comment
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Tiptap editor for description
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Add a description...',
      }),
    ],
    content: issueDescription,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[120px] focus:outline-none px-3 py-2 rounded-md border bg-background',
      },
    },
    onBlur: ({ editor }) => {
      const html = editor.getHTML()
      if (html !== issueDescription) {
        handleFieldUpdate('description', html)
      }
    },
  })

  type IssueUpdateKey = keyof IssueUpdate

  const handleFieldUpdate = useCallback(
    async (field: IssueUpdateKey, value: IssueUpdate[IssueUpdateKey]) => {
      try {
        await updateIssue(issue.id, { [field]: value } as IssueUpdate)
        router.refresh()
      } catch (error) {
        console.error(`Failed to update ${field}:`, error)
      }
    },
    [issue.id, router]
  )

  const handleTitleSave = async () => {
    if (title.trim() && title !== issue.title) {
      await handleFieldUpdate('title', title.trim())
    }
    setIsEditingTitle(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) return
    try {
      await deleteIssue(issue.id)
      router.push(`/org/${orgSlug}/projects/${projectKey}/board`)
    } catch (error) {
      console.error('Failed to delete issue:', error)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from('comments').insert({
        issue_id: issue.id,
        author_id: user.id,
        content: commentText.trim(),
      })

      setCommentText('')
      router.refresh()
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleLabelsChange = async (labelId: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const hasLabel = issue.labels?.some((l) => l.id === labelId)

      if (hasLabel) {
        await supabase
          .from('issue_labels')
          .delete()
          .eq('issue_id', issue.id)
          .eq('label_id', labelId)
      } else {
        await supabase.from('issue_labels').insert({
          issue_id: issue.id,
          label_id: labelId,
        })
      }

      router.refresh()
    } catch (error) {
      console.error('Failed to update labels:', error)
    }
  }

  return (
    <div className="flex h-full gap-0">
      {/* Left Side - Main Content (2/3) */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{ISSUE_TYPE_ICONS[issue.type]}</span>
            <span className="font-medium">{issueKey}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave()
              if (e.key === 'Escape') {
                setTitle(issue.title)
                setIsEditingTitle(false)
              }
            }}
            className="mb-3 text-xl font-bold"
            autoFocus
          />
        ) : (
          <h1
            className="mb-3 cursor-pointer text-xl font-bold hover:bg-accent/50 rounded px-1 -mx-1"
            onClick={() => setIsEditingTitle(true)}
          >
            {issue.title}
          </h1>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Description
          </h3>
          <EditorContent editor={editor} />
        </div>

        <Separator className="my-6" />

        {/* Comments Section */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
            Comments ({issue.comments?.length ?? 0})
          </h3>

          <div className="space-y-4">
            {issue.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={comment.author?.avatar_url ?? undefined}
                    alt={comment.author?.full_name ?? ''}
                  />
                  <AvatarFallback className="text-xs">
                    {comment.author?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author?.full_name ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    {typeof comment.content === 'string'
                      ? comment.content
                      : JSON.stringify(comment.content)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? 'Posting...' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar (1/3) */}
      <div className="w-72 shrink-0 border-l overflow-y-auto p-3 space-y-3">
        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Status
          </label>
          <Select
            value={issue.column_id}
            onValueChange={(value) => {
              const col = columns.find((c) => c.id === value)
              handleFieldUpdate('column_id', value)
              if (col) handleFieldUpdate('status', col.name)
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: col.color ?? '#6B7280' }}
                    />
                    {col.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Priority
          </label>
          <Select
            value={issue.priority}
            onValueChange={(value) =>
              handleFieldUpdate('priority', value)
            }
          >
            <SelectTrigger className="h-9">
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

        {/* Assignee */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Assignee
          </label>
          <Select
            value={issue.assignee_id ?? UNASSIGNED_VALUE}
            onValueChange={(value) =>
              handleFieldUpdate(
                'assignee_id',
                value === UNASSIGNED_VALUE ? null : value
              )
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <span className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {member.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    {member.full_name ?? member.email}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reporter */}
        {issue.reporter && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reporter
            </label>
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={issue.reporter.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {issue.reporter.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span>{issue.reporter.full_name ?? 'Unknown'}</span>
            </div>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Type
          </label>
          <Select
            value={issue.type}
            onValueChange={(value) => handleFieldUpdate('type', value)}
          >
            <SelectTrigger className="h-9">
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

        {/* Story Points */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Story Points
          </label>
          <Select
            value={issue.story_points != null ? String(issue.story_points) : '__none__'}
            onValueChange={(value) =>
              handleFieldUpdate(
                'story_points',
                value === '__none__' ? null : Number(value)
              )
            }
          >
            <SelectTrigger className="h-9">
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

        {/* Sprint */}
        {sprints.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sprint
            </label>
            <Select
              value={issue.sprint_id ?? NO_SPRINT_VALUE}
              onValueChange={(value) =>
                handleFieldUpdate(
                  'sprint_id',
                  value === NO_SPRINT_VALUE ? null : value
                )
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Backlog" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SPRINT_VALUE}>Backlog</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      {s.name}
                      <span className="text-[10px] text-muted-foreground capitalize">
                        ({s.status})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Due Date */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Due Date
          </label>
          <Input
            type="date"
            value={issue.due_date ?? ''}
            onChange={(e) =>
              handleFieldUpdate('due_date', e.target.value || null)
            }
            className="h-9"
          />
        </div>

        {/* Labels */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Labels
          </label>
          {issue.labels && issue.labels.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {issue.labels.map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    borderColor: `${label.color}40`,
                  }}
                  onClick={() => handleLabelsChange(label.id)}
                >
                  {label.name} x
                </Badge>
              ))}
            </div>
          )}
          {projectLabels.length > 0 && (
            <div className="space-y-1">
              {projectLabels
                .filter(
                  (pl) => !issue.labels?.some((il) => il.id === pl.id)
                )
                .map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelsChange(label.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Dates */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Created</span>
            <span>
              {new Date(issue.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span>
              {new Date(issue.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
