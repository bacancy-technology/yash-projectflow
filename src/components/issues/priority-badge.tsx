import { Badge } from '@/components/ui/badge'
import { PRIORITY_COLORS } from '@/lib/constants'
import { ChevronsUp, ChevronUp, Minus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: keyof typeof PRIORITY_COLORS
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs font-medium capitalize',
        PRIORITY_COLORS[priority],
        className
      )}
    >
      {priority}
    </Badge>
  )
}

const priorityIconMap = {
  critical: { icon: ChevronsUp, className: 'text-red-600' },
  high: { icon: ChevronUp, className: 'text-orange-500' },
  medium: { icon: Minus, className: 'text-yellow-500' },
  low: { icon: ChevronDown, className: 'text-blue-500' },
} as const

interface PriorityIconProps {
  priority: keyof typeof PRIORITY_COLORS
  className?: string
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  const config = priorityIconMap[priority]
  const Icon = config.icon
  return <Icon className={cn('h-3.5 w-3.5', config.className, className)} />
}
