'use client'

import { eachMonthOfInterval, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface RoadmapHeaderProps {
  startDate: Date
  endDate: Date
  monthWidth: number
}

export function RoadmapHeader({ startDate, endDate, monthWidth }: RoadmapHeaderProps) {
  const months = eachMonthOfInterval({ start: startDate, end: endDate })

  return (
    <div className="flex border-b bg-muted/30 sticky top-0 z-10">
      {/* Label column */}
      <div className="w-64 shrink-0 border-r px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Epic
        </span>
      </div>

      {/* Month columns */}
      <div className="flex flex-1">
        {months.map((month, i) => (
          <div
            key={month.toISOString()}
            className={cn(
              'shrink-0 border-r border-border/40 px-2 py-2',
              i % 2 === 0 ? 'bg-muted/20' : ''
            )}
            style={{ width: monthWidth }}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {format(month, 'MMM yyyy')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
