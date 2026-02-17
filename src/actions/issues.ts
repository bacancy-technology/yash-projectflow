'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import type { Comment, Issue, Label, Profile } from '@/types'

export type IssueUpdate = Partial<
  Pick<
    Issue,
    | 'title'
    | 'description'
    | 'type'
    | 'priority'
    | 'status'
    | 'assignee_id'
    | 'column_id'
    | 'due_date'
    | 'start_date'
    | 'sprint_id'
    | 'story_points'
    | 'position'
  >
>

function normalizePlan(plan: unknown): PlanType {
  if (typeof plan === 'string' && plan in PLAN_LIMITS) {
    return plan as PlanType
  }
  return 'free'
}

export async function createIssue(
  projectId: string,
  columnId: string,
  data: {
    title: string
    description?: string | null
    type?: Issue['type']
    priority?: Issue['priority']
    assignee_id?: string | null
    due_date?: string | null
    sprint_id?: string | null
    story_points?: number | null
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check plan limits
  const { data: project } = await supabase
    .from('projects')
    .select('id, org_id, key')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', project.org_id)
    .single()

  const plan = normalizePlan(org?.plan)
  const limit = PLAN_LIMITS[plan].issuesPerProject

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if ((count ?? 0) >= limit) {
      throw new Error(
        `Issue limit reached for the ${plan} plan (${limit} issues per project)`
      )
    }
  }

  // Get next issue number
  const { data: maxIssue } = await supabase
    .from('issues')
    .select('issue_number')
    .eq('project_id', projectId)
    .order('issue_number', { ascending: false })
    .limit(1)
    .single()

  const nextNumber = (maxIssue?.issue_number ?? 0) + 1

  // Get max position in target column
  const { data: maxPos } = await supabase
    .from('issues')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (maxPos?.position ?? -1) + 1

  // Get column name for status
  const { data: column } = await supabase
    .from('board_columns')
    .select('name')
    .eq('id', columnId)
    .single()

  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      project_id: projectId,
      column_id: columnId,
      issue_number: nextNumber,
      title: data.title,
      description: data.description ?? null,
      type: data.type ?? 'task',
      priority: data.priority ?? 'medium',
      status: column?.name ?? 'To Do',
      assignee_id: data.assignee_id ?? null,
      reporter_id: user.id,
      due_date: data.due_date ?? null,
      sprint_id: data.sprint_id ?? null,
      story_points: data.story_points ?? null,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log activity
  await supabase.from('activity_log').insert({
    org_id: project.org_id,
    project_id: projectId,
    issue_id: issue.id,
    user_id: user.id,
    action: 'issue.created',
    metadata: {
      issue_key: `${project.key}-${nextNumber}`,
      title: data.title,
    },
  })

  revalidatePath('/', 'layout')
  return issue
}

export async function updateIssue(
  issueId: string,
  data: IssueUpdate
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current issue for comparison
  const { data: currentIssue } = await supabase
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .single()

  if (!currentIssue) throw new Error('Issue not found')

  const { data: project } = await supabase
    .from('projects')
    .select('org_id, key')
    .eq('id', currentIssue.project_id)
    .single()

  if (!project) throw new Error('Project not found')

  const { data: issue, error } = await supabase
    .from('issues')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', issueId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log activity for important changes
  type ImportantField = 'status' | 'assignee_id' | 'priority' | 'column_id'
  const importantFields: ImportantField[] = [
    'status',
    'assignee_id',
    'priority',
    'column_id',
  ]
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const field of importantFields) {
    const nextValue = data[field]
    if (nextValue === undefined) continue

    const prevValue = currentIssue[field] as unknown
    if (nextValue === prevValue) continue

    changes[field] = { from: prevValue, to: nextValue }
  }

  if (Object.keys(changes).length > 0) {
    await supabase.from('activity_log').insert({
      org_id: project.org_id,
      project_id: currentIssue.project_id,
      issue_id: issueId,
      user_id: user.id,
      action: 'issue.updated',
      metadata: {
        issue_key: `${project.key}-${currentIssue.issue_number}`,
        changes,
      },
    })
  }

  revalidatePath('/', 'layout')
  return issue
}

export async function deleteIssue(issueId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: issue } = await supabase
    .from('issues')
    .select('id, project_id, issue_number, title')
    .eq('id', issueId)
    .single()

  if (!issue) throw new Error('Issue not found')

  const { data: project } = await supabase
    .from('projects')
    .select('org_id, key')
    .eq('id', issue.project_id)
    .single()

  if (!project) throw new Error('Project not found')

  const { error } = await supabase.from('issues').delete().eq('id', issueId)
  if (error) throw new Error(error.message)

  await supabase.from('activity_log').insert({
    org_id: project.org_id,
    project_id: issue.project_id,
    issue_id: issueId,
    user_id: user.id,
    action: 'issue.deleted',
    metadata: {
      issue_key: `${project.key}-${issue.issue_number}`,
      title: issue.title,
    },
  })

  revalidatePath('/', 'layout')
}

export async function moveIssue(
  issueId: string,
  newColumnId: string,
  newPosition: number
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: issue } = await supabase
    .from('issues')
    .select('id, project_id, issue_number, status, column_id')
    .eq('id', issueId)
    .single()

  if (!issue) throw new Error('Issue not found')

  const { data: project } = await supabase
    .from('projects')
    .select('org_id, key')
    .eq('id', issue.project_id)
    .single()

  if (!project) throw new Error('Project not found')

  const oldColumnId = issue.column_id

  // Get new column name for status
  const { data: newColumn } = await supabase
    .from('board_columns')
    .select('name')
    .eq('id', newColumnId)
    .single()

  // Shift positions in the new column: push down items at or after newPosition
  const { data: existingIssues } = await supabase
    .from('issues')
    .select('id, position')
    .eq('column_id', newColumnId)
    .gte('position', newPosition)
    .order('position', { ascending: false })

  if (existingIssues) {
    for (const ei of existingIssues) {
      await supabase
        .from('issues')
        .update({ position: ei.position + 1 })
        .eq('id', ei.id)
    }
  }

  // Move issue to new column
  const { error } = await supabase
    .from('issues')
    .update({
      column_id: newColumnId,
      position: newPosition,
      status: newColumn?.name ?? issue.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', issueId)

  if (error) throw new Error(error.message)

  // Compact positions in old column
  const { data: oldColumnIssues } = await supabase
    .from('issues')
    .select('id, position')
    .eq('column_id', oldColumnId)
    .neq('id', issueId)
    .order('position', { ascending: true })

  if (oldColumnIssues) {
    for (let i = 0; i < oldColumnIssues.length; i++) {
      if (oldColumnIssues[i].position !== i) {
        await supabase
          .from('issues')
          .update({ position: i })
          .eq('id', oldColumnIssues[i].id)
      }
    }
  }

  // Log activity
  const { data: oldColumn } = await supabase
    .from('board_columns')
    .select('name')
    .eq('id', oldColumnId)
    .single()

  await supabase.from('activity_log').insert({
    org_id: project.org_id,
    project_id: issue.project_id,
    issue_id: issueId,
    user_id: user.id,
    action: 'issue.moved',
    metadata: {
      issue_key: `${project.key}-${issue.issue_number}`,
      from_column: oldColumn?.name,
      to_column: newColumn?.name,
    },
  })

  revalidatePath('/', 'layout')
}

export async function reorderIssue(issueId: string, newPosition: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: issue } = await supabase
    .from('issues')
    .select('id, column_id, position')
    .eq('id', issueId)
    .single()

  if (!issue) throw new Error('Issue not found')

  const columnId = issue.column_id

  // Get all issues in the column except the moving one
  const { data: columnIssues } = await supabase
    .from('issues')
    .select('id, position')
    .eq('column_id', columnId)
    .neq('id', issueId)
    .order('position', { ascending: true })

  if (!columnIssues) return

  // Reinsert at new position
  const reordered = [...columnIssues]
  reordered.splice(newPosition, 0, { id: issueId, position: newPosition })

  for (let i = 0; i < reordered.length; i++) {
    if (reordered[i].position !== i) {
      await supabase
        .from('issues')
        .update({ position: i })
        .eq('id', reordered[i].id)
    }
  }

  revalidatePath('/', 'layout')
}

export async function getIssues(
  projectId: string,
  filters?: {
    type?: string[]
    priority?: string[]
    assignee_id?: string
    search?: string
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('issues')
    .select('*, assignee:profiles!issues_assignee_id_fkey(*)')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data
}

export async function getIssue(projectId: string, issueNumber: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('issues')
    .select(
      `*,
      assignee:profiles!issues_assignee_id_fkey(*),
      reporter:profiles!issues_reporter_id_fkey(*),
      labels:issue_labels(label:labels(*)),
      comments(*, author:profiles!comments_author_id_fkey(*))`
    )
    .eq('project_id', projectId)
    .eq('issue_number', issueNumber)
    .single()

  if (error) throw new Error(error.message)

	  type IssueLabelJoin = { label: Label | null }
	  type CommentWithAuthor = Comment & { author?: Profile | null }
	  type IssueWithJoins = Omit<Issue, 'labels'> & {
	    labels?: IssueLabelJoin[] | null
	    comments?: CommentWithAuthor[] | null
	  }

  const issue = data as unknown as IssueWithJoins

  const labels = (issue.labels ?? [])
    .map((row) => row.label)
    .filter((label): label is Label => !!label)

  const comments = (issue.comments ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  return {
    ...issue,
    labels,
    comments,
  }
}
