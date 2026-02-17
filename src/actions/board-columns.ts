'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createBoardColumn(
  projectId: string,
  data: { name: string; color?: string | null }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add columns.' }
  }

  const name = data.name.trim()
  if (!name) {
    return { error: 'Column name is required.' }
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, org_id, key')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Project not found.' }
  }

  const { data: maxPos } = await supabase
    .from('board_columns')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = (maxPos?.position ?? -1) + 1

  const { data: column, error } = await supabase
    .from('board_columns')
    .insert({
      project_id: projectId,
      name,
      color: data.color ?? null,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', project.org_id)
    .single()

  if (org?.slug) {
    revalidatePath(`/org/${org.slug}/projects/${project.key}/board`)
    revalidatePath(`/org/${org.slug}/projects/${project.key}/settings`)
  } else {
    revalidatePath('/', 'layout')
  }

  return { success: true as const, column }
}

