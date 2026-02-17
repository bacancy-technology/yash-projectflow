import { getAllSubscriptions, getAdminStats } from '@/actions/admin'
import { SubscriptionTable } from '@/components/admin/subscription-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { PLAN_PRICES } from '@/lib/constants'
import type { PlanType } from '@/lib/constants'

export default async function AdminSubscriptionsPage() {
  const [subscriptions, stats] = await Promise.all([
    getAllSubscriptions(),
    getAdminStats(),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage all subscriptions and view revenue.
        </p>
      </div>

      {/* Revenue summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.monthlyRevenue}/mo
            </div>
          </CardContent>
        </Card>
        {(['free', 'pro', 'enterprise'] as PlanType[]).map((plan) => {
          const count = stats.planBreakdown[plan] ?? 0
          return (
            <Card key={plan}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                  {plan} Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  ${count * PLAN_PRICES[plan]}/mo
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SubscriptionTable subscriptions={subscriptions} />
    </div>
  )
}
