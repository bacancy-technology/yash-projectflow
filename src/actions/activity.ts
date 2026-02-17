"use server"

import { createClient } from "@/lib/supabase/server"

export async function logActivity(params: {
  orgId: string
  projectId?: string
  issueId?: string
  action: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be logged in" }
  }

  const { error } = await supabase.from("activity_log").insert({
    org_id: params.orgId,
    project_id: params.projectId ?? null,
    issue_id: params.issueId ?? null,
    user_id: user.id,
    action: params.action,
    metadata: params.metadata ?? null,
  })

  if (error) {
    return { error: error.message }
  }

  return { data: { success: true } }
}

export async function getActivityLog(
  orgId: string,
  options?: { projectId?: string; limit?: number; offset?: number }
) {
  const supabase = await createClient()

  let query = supabase
    .from("activity_log")
    .select("*, user:profiles!user_id(*)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (options?.projectId) {
    query = query.eq("project_id", options.projectId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 20) - 1
    )
  }

  const { data: activities, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { data: activities }
}

export async function getIssueActivity(issueId: string) {
  const supabase = await createClient()

  const { data: activities, error } = await supabase
    .from("activity_log")
    .select("*, user:profiles!user_id(*)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data: activities }
}
