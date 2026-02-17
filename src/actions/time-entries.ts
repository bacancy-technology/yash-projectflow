'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TimeEntry, Profile } from '@/types'

export async function createTimeEntry(
  issueId: string,
  data: {
    duration_minutes: number
    description?: string | null
    date?: string | null
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  if (!data.duration_minutes || data.duration_minutes <= 0) {
    throw new Error('Duration must be greater than 0')
  }

  const { data: entry, error } = await supabase
    .from('time_entries')
    .insert({
      issue_id: issueId,
      user_id: user.id,
      duration_minutes: data.duration_minutes,
      description: data.description ?? null,
      date: data.date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log activity
  const { data: issue } = await supabase
    .from('issues')
    .select('project_id, issue_number')
    .eq('id', issueId)
    .single()

  if (issue) {
    const { data: project } = await supabase
      .from('projects')
      .select('org_id, key')
      .eq('id', issue.project_id)
      .single()

    if (project) {
      await supabase.from('activity_log').insert({
        org_id: project.org_id,
        project_id: issue.project_id,
        issue_id: issueId,
        user_id: user.id,
        action: 'time.logged',
        metadata: {
          issue_key: `${project.key}-${issue.issue_number}`,
          duration_minutes: data.duration_minutes,
        },
      })
    }
  }

  revalidatePath('/', 'layout')
  return entry
}

export async function deleteTimeEntry(entryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: entry } = await supabase
    .from('time_entries')
    .select('user_id')
    .eq('id', entryId)
    .single()

  if (!entry) throw new Error('Time entry not found')
  if (entry.user_id !== user.id) throw new Error('You can only delete your own time entries')

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
}

export async function getTimeEntriesForIssue(issueId: string): Promise<TimeEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('time_entries')
    .select('*, user:profiles!time_entries_user_id_fkey(*)')
    .eq('issue_id', issueId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TimeEntry[]
}

type TimeReportEntry = {
  user: Profile
  total_minutes: number
  issues: {
    issue_id: string
    issue_key: string
    title: string
    total_minutes: number
  }[]
}

export async function getTimeReportForProject(
  projectId: string,
  dateRange?: { from: string; to: string }
): Promise<TimeReportEntry[]> {
  const supabase = await createClient()

  // Get all issues for this project
  const { data: issues } = await supabase
    .from('issues')
    .select('id, issue_number, title')
    .eq('project_id', projectId)

  if (!issues || issues.length === 0) return []

  const { data: project } = await supabase
    .from('projects')
    .select('key')
    .eq('id', projectId)
    .single()

  const projectKey = project?.key ?? ''
  const issueIds = issues.map((i) => i.id)
  const issueMap = new Map(issues.map((i) => [i.id, i]))

  let query = supabase
    .from('time_entries')
    .select('*, user:profiles!time_entries_user_id_fkey(*)')
    .in('issue_id', issueIds)

  if (dateRange?.from) {
    query = query.gte('date', dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte('date', dateRange.to)
  }

  const { data: entries, error } = await query.order('date', { ascending: false })

  if (error) throw new Error(error.message)
  if (!entries || entries.length === 0) return []

  // Aggregate by user
  const userMap = new Map<string, TimeReportEntry>()

  for (const entry of entries as TimeEntry[]) {
    const userId = entry.user_id
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user: entry.user!,
        total_minutes: 0,
        issues: [],
      })
    }

    const userEntry = userMap.get(userId)!
    userEntry.total_minutes += entry.duration_minutes

    let issueEntry = userEntry.issues.find((i) => i.issue_id === entry.issue_id)
    if (!issueEntry) {
      const iss = issueMap.get(entry.issue_id)
      issueEntry = {
        issue_id: entry.issue_id,
        issue_key: iss ? `${projectKey}-${iss.issue_number}` : '',
        title: iss?.title ?? '',
        total_minutes: 0,
      }
      userEntry.issues.push(issueEntry)
    }
    issueEntry.total_minutes += entry.duration_minutes
  }

  return Array.from(userMap.values()).sort((a, b) => b.total_minutes - a.total_minutes)
}
