"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createComment(issueId: string, content: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in to comment" }
  }

  const jsonContent = { type: "text", text: content }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      issue_id: issueId,
      author_id: user.id,
      content: jsonContent,
    })
    .select("*, author:profiles!author_id(*)")
    .single()

  if (error) {
    return { error: error.message }
  }

  // Get the issue to find project, org, assignee, and reporter
  const { data: issue } = await supabase
    .from("issues")
    .select("*, project:projects!project_id(id, org_id, key)")
    .eq("id", issueId)
    .single()

  if (issue?.project) {
    const project = issue.project as { id: string; org_id: string; key: string }

    // Log activity
    await supabase.from("activity_log").insert({
      org_id: project.org_id,
      project_id: project.id,
      issue_id: issueId,
      user_id: user.id,
      action: "comment_created",
      metadata: {
        issue_key: `${project.key}-${issue.issue_number}`,
        issue_title: issue.title,
      },
    })

    // Create notifications for assignee and reporter (if they are not the commenter)
    const notifyUserIds = new Set<string>()
    if (issue.assignee_id && issue.assignee_id !== user.id) {
      notifyUserIds.add(issue.assignee_id)
    }
    if (issue.reporter_id && issue.reporter_id !== user.id) {
      notifyUserIds.add(issue.reporter_id)
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const authorName = profile?.full_name || "Someone"
    const issueKey = `${project.key}-${issue.issue_number}`

    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", project.org_id)
      .single()

    const link = org?.slug
      ? `/org/${org.slug}/projects/${project.key}/issues/${issueKey}`
      : null

    const notifications = Array.from(notifyUserIds).map((userId) => ({
      user_id: userId,
      org_id: project.org_id,
      type: "comment",
      title: `New comment on ${issueKey}`,
      message: `${authorName} commented on ${issueKey}: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
      link,
      is_read: false,
    }))

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications)
    }
  }

  revalidatePath("/")
  return { data: comment }
}

export async function updateComment(commentId: string, content: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in" }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .single()

  if (!existing) {
    return { error: "Comment not found" }
  }

  if (existing.author_id !== user.id) {
    return { error: "You can only edit your own comments" }
  }

  const jsonContent = { type: "text", text: content }

  const { data: comment, error } = await supabase
    .from("comments")
    .update({ content: jsonContent, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .select("*, author:profiles!author_id(*)")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { data: comment }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in" }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .single()

  if (!existing) {
    return { error: "Comment not found" }
  }

  if (existing.author_id !== user.id) {
    return { error: "You can only delete your own comments" }
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  return { data: { success: true } }
}

export async function getComments(issueId: string) {
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, author:profiles!author_id(*)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data: comments }
}
