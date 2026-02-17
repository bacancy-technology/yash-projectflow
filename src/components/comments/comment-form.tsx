"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createComment } from "@/actions/comments"

interface CommentFormProps {
  issueId: string
}

export function CommentForm({ issueId }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createComment(issueId, content.trim())
      if (!result.error) {
        setContent("")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[100px] resize-none text-sm"
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Press{" "}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">
            Cmd
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">
            Enter
          </kbd>{" "}
          to submit
        </p>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Comment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
