'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import type { Subscription } from '@/types'

type PlanLimits = (typeof PLAN_LIMITS)[PlanType]

export function useSubscription(orgId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const plan: PlanType = subscription?.plan ?? 'free'
  const limits: PlanLimits = PLAN_LIMITS[plan]

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchSubscription() {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('org_id', orgId!)
          .eq('status', 'active')
          .maybeSingle()

        if (data) {
          setSubscription(data as Subscription)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [orgId])

  const isAtLimit = (feature: keyof PlanLimits, currentCount: number): boolean => {
    const limit = limits[feature]
    if (typeof limit === 'boolean') return !limit
    if (limit === Infinity) return false
    return currentCount >= limit
  }

  return { subscription, plan, limits, loading, isAtLimit }
}
