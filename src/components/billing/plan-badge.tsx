import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/constants'

const planStyles: Record<PlanType, string> = {
  free: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  enterprise: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
}

const planLabels: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

interface PlanBadgeProps {
  plan: PlanType
  className?: string
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(planStyles[plan], className)}>
      {planLabels[plan]}
    </Badge>
  )
}
