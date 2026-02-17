import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, CreditCard, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminStatsProps {
  stats: {
    totalOrgs: number
    totalUsers: number
    activeSubscriptions: number
    monthlyRevenue: number
  }
}

const statCards = [
  {
    key: 'totalOrgs' as const,
    label: 'Total Organizations',
    icon: Building2,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'totalUsers' as const,
    label: 'Total Users',
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'activeSubscriptions' as const,
    label: 'Active Subscriptions',
    icon: CreditCard,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'monthlyRevenue' as const,
    label: 'Est. Monthly Revenue',
    icon: DollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    format: (v: number) => `$${v.toLocaleString()}`,
  },
]

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <div className={cn('rounded-md p-2', card.bgColor)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.format(stats[card.key])}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
