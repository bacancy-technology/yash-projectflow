import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  FolderKanban,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DashboardStats {
  totalProjects: number
  openIssues: number
  completedThisWeek: number
  overdueIssues: number
}

interface StatsCardsProps {
  stats: DashboardStats
}

const cards = [
  {
    key: 'totalProjects' as const,
    label: 'Total Projects',
    icon: FolderKanban,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    key: 'openIssues' as const,
    label: 'Open Issues',
    icon: CircleDot,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
  },
  {
    key: 'completedThisWeek' as const,
    label: 'Completed This Week',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
  },
  {
    key: 'overdueIssues' as const,
    label: 'Overdue Issues',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = stats[card.key]

        return (
          <Card key={card.key} className="py-2.5">
            <CardContent className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded',
                  card.bg
                )}
              >
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
