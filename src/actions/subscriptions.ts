'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import type { Subscription } from '@/types'

export async function getCurrentPlan(
  orgId: string
): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return null
  }

  return data as Subscription
}

export async function upgradePlan(
  orgId: string,
  newPlan: 'pro' | 'enterprise'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is owner or admin
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: 'You do not have permission to change the plan' }
  }

  const now = new Date().toISOString()

  // Update the subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      plan: newPlan,
      status: 'active',
      current_period_start: now,
      updated_at: now,
    })
    .eq('org_id', orgId)
    .eq('status', 'active')

  if (subError) {
    return { error: subError.message }
  }

  // Update the organization plan
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan: newPlan, updated_at: now })
    .eq('id', orgId)

  if (orgError) {
    return { error: orgError.message }
  }

  revalidatePath('/', 'layout')
  return { data: { success: true } }
}

export async function downgradePlan(
  orgId: string,
  newPlan: 'free' | 'pro'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is owner or admin
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: 'You do not have permission to change the plan' }
  }

  const now = new Date().toISOString()

  // Update the subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      plan: newPlan,
      status: 'active',
      current_period_start: now,
      updated_at: now,
    })
    .eq('org_id', orgId)
    .eq('status', 'active')

  if (subError) {
    return { error: subError.message }
  }

  // Update the organization plan
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan: newPlan, updated_at: now })
    .eq('id', orgId)

  if (orgError) {
    return { error: orgError.message }
  }

  revalidatePath('/', 'layout')
  return { data: { success: true } }
}

export async function checkLimit(
  orgId: string,
  feature: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await createClient()

  // Get org plan
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  if (!org) {
    return { allowed: false, current: 0, limit: 0 }
  }

  const plan = org.plan as PlanType
  const limits = PLAN_LIMITS[plan]

  let current = 0
  let limit = 0

  switch (feature) {
    case 'projects': {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
      current = count ?? 0
      limit = limits.projects
      break
    }
    case 'members': {
      const { count } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
      current = count ?? 0
      limit = limits.members
      break
    }
    case 'issuesPerProject': {
      // For issues, we check the max across all projects
      // This is a simplified check - caller should pass project-specific context
      current = 0
      limit = limits.issuesPerProject
      break
    }
    case 'labelsPerProject': {
      current = 0
      limit = limits.labelsPerProject
      break
    }
    default: {
      return { allowed: true, current: 0, limit: Infinity }
    }
  }

  return {
    allowed: limit === Infinity || current < limit,
    current,
    limit: limit === Infinity ? -1 : limit,
  }
}
