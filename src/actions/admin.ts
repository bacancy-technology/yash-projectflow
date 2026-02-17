'use server'

import { createClient } from '@/lib/supabase/server'
import { PLAN_PRICES } from '@/lib/constants'
import type { PlanType } from '@/lib/constants'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!superAdmin) {
    throw new Error('Not authorized: super admin access required')
  }

  return { supabase, user }
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !!data
}

export async function getAdminStats() {
  const { supabase } = await requireSuperAdmin()

  const [orgsResult, usersResult, subsResult] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('status', 'active'),
  ])

  const totalOrgs = orgsResult.count ?? 0
  const totalUsers = usersResult.count ?? 0
  const activeSubs = subsResult.data ?? []
  const activeSubscriptions = activeSubs.length

  const planBreakdown = { free: 0, pro: 0, enterprise: 0 }
  let monthlyRevenue = 0

  for (const sub of activeSubs) {
    const plan = sub.plan as PlanType
    planBreakdown[plan] = (planBreakdown[plan] || 0) + 1
    monthlyRevenue += PLAN_PRICES[plan] ?? 0
  }

  return {
    totalOrgs,
    totalUsers,
    activeSubscriptions,
    monthlyRevenue,
    planBreakdown,
  }
}

export async function getAllOrgs(search?: string, planFilter?: string) {
  const { supabase } = await requireSuperAdmin()

  let query = supabase
    .from('organizations')
    .select(`
      *,
      owner:profiles!organizations_owner_id_fkey(id, full_name, email, avatar_url),
      subscription:subscriptions(plan, status),
      members:organization_members(count),
      projects:projects(count)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  if (planFilter && planFilter !== 'all') {
    query = query.eq('plan', planFilter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((org) => ({
    ...org,
    owner: Array.isArray(org.owner) ? org.owner[0] : org.owner,
    subscription: Array.isArray(org.subscription) ? org.subscription[0] : org.subscription,
    memberCount: org.members?.[0]?.count ?? 0,
    projectCount: org.projects?.[0]?.count ?? 0,
  }))
}

export async function getAllUsers(search?: string) {
  const { supabase } = await requireSuperAdmin()

  let query = supabase
    .from('profiles')
    .select(`
      *,
      memberships:organization_members(count)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((user) => ({
    ...user,
    orgCount: user.memberships?.[0]?.count ?? 0,
  }))
}

export async function getAllSubscriptions(
  planFilter?: string,
  statusFilter?: string
) {
  const { supabase } = await requireSuperAdmin()

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      organization:organizations(id, name, slug)
    `)
    .order('created_at', { ascending: false })

  if (planFilter && planFilter !== 'all') {
    query = query.eq('plan', planFilter)
  }

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((sub) => ({
    ...sub,
    organization: Array.isArray(sub.organization)
      ? sub.organization[0]
      : sub.organization,
  }))
}

export async function updateOrgPlan(orgId: string, newPlan: string) {
  const { supabase } = await requireSuperAdmin()

  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan: newPlan, updated_at: new Date().toISOString() })
    .eq('id', orgId)

  if (orgError) {
    throw new Error(orgError.message)
  }

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({ plan: newPlan, updated_at: new Date().toISOString() })
    .eq('org_id', orgId)

  if (subError) {
    throw new Error(subError.message)
  }

  return { success: true }
}

export async function deleteOrgAdmin(orgId: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function toggleSuperAdmin(userId: string) {
  const { supabase } = await requireSuperAdmin()

  const { data: existing } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('super_admins')
      .delete()
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    return { isSuperAdmin: false }
  } else {
    const { error } = await supabase
      .from('super_admins')
      .insert({ user_id: userId })

    if (error) throw new Error(error.message)
    return { isSuperAdmin: true }
  }
}

export async function addSuperAdminByEmail(email: string) {
  const { supabase } = await requireSuperAdmin()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('User not found with that email')
  }

  const { data: existing } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  if (existing) {
    throw new Error('User is already a super admin')
  }

  const { error } = await supabase
    .from('super_admins')
    .insert({ user_id: profile.id })

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function removeSuperAdmin(userId: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from('super_admins')
    .delete()
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function getSuperAdmins() {
  const { supabase } = await requireSuperAdmin()

  const { data, error } = await supabase
    .from('super_admins')
    .select(`
      *,
      profile:profiles!super_admins_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((sa) => ({
    ...sa,
    profile: Array.isArray(sa.profile) ? sa.profile[0] : sa.profile,
  }))
}

export async function getRecentSignups(limit = 10) {
  const { supabase } = await requireSuperAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRecentOrgs(limit = 10) {
  const { supabase } = await requireSuperAdmin()

  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      owner:profiles!organizations_owner_id_fkey(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((org) => ({
    ...org,
    owner: Array.isArray(org.owner) ? org.owner[0] : org.owner,
  }))
}
