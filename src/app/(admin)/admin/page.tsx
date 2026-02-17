import { getAdminStats, getRecentSignups, getRecentOrgs } from '@/actions/admin'
import { AdminStats } from '@/components/admin/admin-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanBadge } from '@/components/billing/plan-badge'
import { PLAN_PRICES } from '@/lib/constants'
import type { PlanType } from '@/lib/constants'

export default async function AdminDashboardPage() {
  const [stats, recentUsers, recentOrgs] = await Promise.all([
    getAdminStats(),
    getRecentSignups(10),
    getRecentOrgs(10),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and recent activity.
        </p>
      </div>

      {/* Stats cards */}
      <AdminStats stats={stats} />

      {/* Revenue breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Breakdown by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(['free', 'pro', 'enterprise'] as PlanType[]).map((plan) => {
              const count = stats.planBreakdown[plan] ?? 0
              const revenue = count * PLAN_PRICES[plan]
              return (
                <div
                  key={plan}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <PlanBadge plan={plan} />
                    <p className="text-sm text-muted-foreground">
                      {count} subscription{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${revenue}</p>
                    <p className="text-xs text-muted-foreground">
                      ${PLAN_PRICES[plan]}/org/mo
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent signups.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.full_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent orgs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent organizations.
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {org.name}
                        </p>
                        <PlanBadge plan={org.plan as PlanType} className="flex-shrink-0 text-xs" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        by {org.owner?.full_name || org.owner?.email || 'Unknown'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {new Date(org.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
