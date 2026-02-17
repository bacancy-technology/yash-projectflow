'use client'

import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface TimeSummaryProps {
  totalMinutes: number
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export { formatDuration }

export function TimeSummary({ totalMinutes }: TimeSummaryProps) {
  return (
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <Badge variant="secondary" className="text-xs font-mono">
        {formatDuration(totalMinutes)}
      </Badge>
    </div>
  )
}
