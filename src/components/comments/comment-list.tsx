"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, MoreHorizontal, Trash2, Edit } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateComment, deleteComment } from "@/actions/comments"
import type { Comment } from "@/types"

interface CommentListProps {
  issueId: string
  comments: Comment[]
  currentUserId?: string
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getCommentText(content: unknown): string {
  if (!content) return ""
  if (typeof content === "string") return content
  if (typeof content === "object" && content !== null && "text" in content) {
    return (content as { text: string }).text
  }
  return JSON.stringify(content)
}

export function CommentList({
  issueId,
  comments,
  currentUserId,
}: CommentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  async function handleUpdate(commentId: string) {
    if (!editContent.trim()) return
    setIsUpdating(true)
    try {
      const result = await updateComment(commentId, editContent.trim())
      if (!result.error) {
        setEditingId(null)
        setEditContent("")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(commentId: string) {
    setIsDeleting(commentId)
    try {
      await deleteComment(commentId)
    } finally {
      setIsDeleting(null)
    }
  }

  function startEditing(comment: Comment) {
    setEditingId(comment.id)
    setEditContent(getCommentText(comment.content))
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="mb-2 h-8 w-8" />
        <p className="text-sm">No comments yet</p>
        <p className="text-xs">Be the first to comment on this issue</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isOwn = currentUserId === comment.author_id
        const isEditing = editingId === comment.id

        return (
          <div key={comment.id} className="flex gap-3">
            <Avatar size="sm">
              {comment.author?.avatar_url && (
                <AvatarImage
                  src={comment.author.avatar_url}
                  alt={comment.author.full_name || "User"}
                />
              )}
              <AvatarFallback>
                {getInitials(comment.author?.full_name ?? null)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {comment.author?.full_name || "Unknown User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}

                {isOwn && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        <span className="sr-only">Comment actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEditing(comment)}>
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting === comment.id}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        {isDeleting === comment.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(comment.id)}
                      disabled={isUpdating || !editContent.trim()}
                    >
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null)
                        setEditContent("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                  {getCommentText(comment.content)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
