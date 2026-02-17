'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Organization } from '@/types'

export async function createOrg(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!name || !slug) {
    throw new Error('Name and slug are required')
  }

  // Enforce one org per user
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existingOrg) {
    throw new Error('You already have an organization. Each user can only own one organization.')
  }

  // Create the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      owner_id: user.id,
      plan: 'free',
    })
    .select()
    .single()

  if (orgError) {
    if (orgError.code === '23505') {
      throw new Error('An organization with this slug already exists. Please choose a different one.')
    }
    throw new Error(orgError.message)
  }

  // Create owner membership
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    })

  if (memberError) {
    throw new Error(memberError.message)
  }

  // Create free subscription
  const { error: subError } = await supabase.from('subscriptions').insert({
    org_id: org.id,
    plan: 'free',
    status: 'active',
  })

  if (subError) {
    throw new Error(subError.message)
  }

  revalidatePath('/dashboard')
  redirect(`/org/${slug}/projects`)
}

export async function updateOrg(orgId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!name || !slug) {
    throw new Error('Name and slug are required')
  }

  // Verify user is owner or admin
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new Error('You do not have permission to update this organization')
  }

  const { error } = await supabase
    .from('organizations')
    .update({ name, slug, updated_at: new Date().toISOString() })
    .eq('id', orgId)

  if (error) {
    if (error.code === '23505') {
      throw new Error('An organization with this slug already exists. Please choose a different one.')
    }
    throw new Error(error.message)
  }

  revalidatePath(`/org/${slug}/settings`)
  redirect(`/org/${slug}/settings`)
}

export async function deleteOrg(orgId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify user is owner
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner') {
    throw new Error('Only the owner can delete an organization')
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function getOrg(slug: string): Promise<Organization | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  return (data as Organization) ?? null
}

export async function getUserOrg(): Promise<Organization | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  return (org as Organization) ?? null
}

export async function getUserOrgs(): Promise<Organization[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    return []
  }

  const orgIds = memberships.map((m) => m.org_id)

  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .order('created_at', { ascending: true })

  return (orgs as Organization[]) ?? []
}
