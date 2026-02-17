'use client'

import { Badge } from '@/components/ui/badge'
import { Calendar, Target } from 'lucide-react'
import type { Sprint } from '@/types'

interface SprintCardProps {
  sprint: Sprint
  issueCount: number
  totalPoints: number
  onClick?: () => void
}

const STATUS_COLORS = {
  planning: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-gray-50 text-gray-600 border-gray-200',
} as const

export function SprintCard({
  sprint,
  issueCount,
  totalPoints,
  onClick,
}: SprintCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold truncate">{sprint.name}</h3>
        <Badge
          variant="outline"
          className={`text-xs capitalize ${STATUS_COLORS[sprint.status]}`}
        >
          {sprint.status}
        </Badge>
      </div>

      {sprint.goal && (
        <div className="flex items-start gap-1.5">
          <Target className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground line-clamp-2">
            {sprint.goal}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {(sprint.start_date || sprint.end_date) && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {sprint.start_date
              ? new Date(sprint.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '?'}
            {' - '}
            {sprint.end_date
              ? new Date(sprint.end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '?'}
          </span>
        )}
        <span>{issueCount} issues</span>
        {totalPoints > 0 && <span>{totalPoints} pts</span>}
      </div>
    </div>
  )
}
