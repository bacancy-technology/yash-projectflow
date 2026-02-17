'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import type { Sprint } from '@/types'

function normalizePlan(plan: unknown): PlanType {
  if (typeof plan === 'string' && plan in PLAN_LIMITS) {
    return plan as PlanType
  }
  return 'free'
}

async function checkSprintAccess(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
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
  if (!PLAN_LIMITS[plan].sprints) {
    throw new Error('Sprints are available on Pro and Enterprise plans. Please upgrade to use this feature.')
  }

  return { project, plan }
}

export async function createSprint(
  projectId: string,
  data: {
    name: string
    goal?: string | null
    start_date?: string | null
    end_date?: string | null
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { project } = await checkSprintAccess(supabase, projectId)

  if (!data.name?.trim()) throw new Error('Sprint name is required')

  const { data: sprint, error } = await supabase
    .from('sprints')
    .insert({
      project_id: projectId,
      name: data.name.trim(),
      goal: data.goal?.trim() || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('activity_log').insert({
    org_id: project.org_id,
    project_id: projectId,
    user_id: user.id,
    action: 'sprint.created',
    metadata: { sprint_name: sprint.name },
  })

  revalidatePath('/', 'layout')
  return sprint as Sprint
}

export async function updateSprint(
  sprintId: string,
  data: Partial<Pick<Sprint, 'name' | 'goal' | 'start_date' | 'end_date'>>
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: sprint, error } = await supabase
    .from('sprints')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', sprintId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return sprint as Sprint
}

export async function deleteSprint(sprintId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Set sprint_id to null for all issues in this sprint
  await supabase
    .from('issues')
    .update({ sprint_id: null })
    .eq('sprint_id', sprintId)

  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', sprintId)

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
}

export async function getSprints(projectId: string): Promise<Sprint[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Sprint[]
}

export async function getActiveSprint(projectId: string): Promise<Sprint | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .maybeSingle()

  return (data as Sprint) ?? null
}

export async function startSprint(sprintId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: sprint } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', sprintId)
    .single()

  if (!sprint) throw new Error('Sprint not found')
  if (sprint.status !== 'planning') throw new Error('Only planning sprints can be started')

  const { data: project } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', sprint.project_id)
    .single()

  const { error } = await supabase
    .from('sprints')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', sprintId)

  if (error) throw new Error(error.message)

  if (project) {
    await supabase.from('activity_log').insert({
      org_id: project.org_id,
      project_id: sprint.project_id,
      user_id: user.id,
      action: 'sprint.started',
      metadata: { sprint_name: sprint.name },
    })
  }

  revalidatePath('/', 'layout')
}

export async function completeSprint(
  sprintId: string,
  action: 'backlog' | 'next_sprint'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: sprint } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', sprintId)
    .single()

  if (!sprint) throw new Error('Sprint not found')
  if (sprint.status !== 'active') throw new Error('Only active sprints can be completed')

  // Find "Done" column IDs for this project
  const { data: doneColumns } = await supabase
    .from('board_columns')
    .select('id')
    .eq('project_id', sprint.project_id)
    .eq('name', 'Done')

  const doneColumnIds = (doneColumns ?? []).map((c) => c.id)

  // Find incomplete issues (not in Done columns)
  let incompleteQuery = supabase
    .from('issues')
    .select('id')
    .eq('sprint_id', sprintId)

  if (doneColumnIds.length > 0) {
    incompleteQuery = incompleteQuery.not(
      'column_id',
      'in',
      `(${doneColumnIds.join(',')})`
    )
  }

  const { data: incompleteIssues } = await incompleteQuery
  const incompleteCount = incompleteIssues?.length ?? 0

  if (incompleteCount > 0) {
    const incompleteIds = incompleteIssues!.map((i) => i.id)

    if (action === 'next_sprint') {
      // Find next planning sprint
      const { data: nextSprint } = await supabase
        .from('sprints')
        .select('id')
        .eq('project_id', sprint.project_id)
        .eq('status', 'planning')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextSprint) {
        await supabase
          .from('issues')
          .update({ sprint_id: nextSprint.id })
          .in('id', incompleteIds)
      } else {
        // No next sprint — move to backlog
        await supabase
          .from('issues')
          .update({ sprint_id: null })
          .in('id', incompleteIds)
      }
    } else {
      // Move to backlog
      await supabase
        .from('issues')
        .update({ sprint_id: null })
        .in('id', incompleteIds)
    }
  }

  // Mark sprint as completed
  const { error } = await supabase
    .from('sprints')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sprintId)

  if (error) throw new Error(error.message)

  const { data: project } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', sprint.project_id)
    .single()

  if (project) {
    await supabase.from('activity_log').insert({
      org_id: project.org_id,
      project_id: sprint.project_id,
      user_id: user.id,
      action: 'sprint.completed',
      metadata: {
        sprint_name: sprint.name,
        incomplete_count: incompleteCount,
        action,
      },
    })
  }

  revalidatePath('/', 'layout')
}

export async function assignIssueToSprint(issueId: string, sprintId: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('issues')
    .update({ sprint_id: sprintId, updated_at: new Date().toISOString() })
    .eq('id', issueId)

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
}
