'use client'

import { useState, useEffect } from 'react'
import { useOrg } from '@/hooks/use-org'
import { useSubscription } from '@/hooks/use-subscription'
import { createClient } from '@/lib/supabase/client'
import { upgradePlan, downgradePlan } from '@/actions/subscriptions'
import { PlanBadge } from '@/components/billing/plan-badge'
import { PricingCards } from '@/components/billing/pricing-cards'
import { UsageWarning } from '@/components/billing/usage-warning'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderKanban, Users } from 'lucide-react'
import type { PlanType } from '@/lib/constants'

export default function BillingSettingsPage() {
  const { currentOrg, memberRole } = useOrg()
  const { subscription, plan, limits, loading } = useSubscription(
    currentOrg?.id
  )
  const [projectCount, setProjectCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [switching, setSwitching] = useState(false)

  const canManageBilling = memberRole === 'owner' || memberRole === 'admin'

  useEffect(() => {
    if (!currentOrg) return

    const orgId = currentOrg.id
    const supabase = createClient()

    async function fetchUsage() {
      const [projects, members] = await Promise.all([
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId),
        supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId),
      ])

      setProjectCount(projects.count ?? 0)
      setMemberCount(members.count ?? 0)
    }

    fetchUsage()
  }, [currentOrg])

  const handleSelectPlan = async (newPlan: PlanType) => {
    if (!currentOrg) return
    setSwitching(true)

    try {
      const supabase = createClient()

      // Update or create subscription
      if (subscription) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            plan: newPlan,
            status: 'active',
            current_period_start: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', currentOrg.id)
          .eq('status', 'active')

        if (subError) {
          console.error('Subscription update error:', subError)
        }
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            org_id: currentOrg.id,
            plan: newPlan,
            status: 'active',
          })

        if (insertError) {
          console.error('Subscription insert error:', insertError)
        }
      }

      // Update organization plan
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          plan: newPlan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrg.id)

      if (orgError) {
        console.error('Organization update error:', orgError)
        return
      }

      window.location.reload()
    } catch (error) {
      console.error('Error switching plan:', error)
    } finally {
      setSwitching(false)
    }
  }

  if (!canManageBilling) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            You do not have permission to access billing.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const projectLimit =
    typeof limits.projects === 'number' ? limits.projects : Infinity
  const memberLimit =
    typeof limits.members === 'number' ? limits.members : Infinity

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Billing</h2>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and view usage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            <PlanBadge plan={plan} />
          </CardTitle>
          <CardDescription>
            {plan === 'free'
              ? 'You are on the free plan. Upgrade to unlock more features.'
              : `You are on the ${plan} plan.`}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {projectCount}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {projectLimit === Infinity ? 'Unlimited' : projectLimit}
              </span>
            </p>
            <UsageWarning
              current={projectCount}
              limit={projectLimit}
              feature="projects"
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {memberCount}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {memberLimit === Infinity ? 'Unlimited' : memberLimit}
              </span>
            </p>
            <UsageWarning
              current={memberCount}
              limit={memberLimit}
              feature="members"
              className="mt-3"
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Plans</h3>
        <PricingCards
          currentPlan={plan}
          onSelectPlan={handleSelectPlan}
          loading={switching}
        />
      </div>
    </div>
  )
}
