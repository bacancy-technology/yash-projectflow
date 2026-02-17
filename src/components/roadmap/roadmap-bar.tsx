'use client'

import { differenceInDays } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PRIORITY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Issue } from '@/types'

interface RoadmapBarProps {
  epic: Issue
  timelineStart: Date
  totalDays: number
  totalWidth: number
  colorBy: 'priority' | 'status'
}

const STATUS_COLORS: Record<string, string> = {
  'To Do': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'In Review': 'bg-yellow-500',
  Done: 'bg-green-500',
}

const PRIORITY_BAR_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
}

export function RoadmapBar({
  epic,
  timelineStart,
  totalDays,
  totalWidth,
  colorBy,
}: RoadmapBarProps) {
  const barStart = epic.start_date
    ? new Date(epic.start_date)
    : new Date(epic.created_at)
  const barEnd = epic.due_date ? new Date(epic.due_date) : new Date()

  const startOffset = Math.max(0, differenceInDays(barStart, timelineStart))
  const duration = Math.max(1, differenceInDays(barEnd, barStart))

  const pxPerDay = totalWidth / totalDays
  const left = startOffset * pxPerDay
  const width = Math.max(40, duration * pxPerDay)

  const barColor =
    colorBy === 'priority'
      ? PRIORITY_BAR_COLORS[epic.priority] ?? 'bg-blue-400'
      : STATUS_COLORS[epic.status] ?? 'bg-gray-400'

  const priorityClass = PRIORITY_COLORS[epic.priority] ?? ''

  const initials = epic.assignee?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn('absolute top-1 h-7 rounded-md flex items-center gap-1.5 px-2 text-white text-xs font-medium shadow-sm cursor-default', barColor)}
      style={{
        left,
        width: Math.min(width, totalWidth - left),
      }}
      title={`${epic.title} (${epic.priority})`}
    >
      {epic.assignee && (
        <Avatar className="h-4 w-4 shrink-0">
          <AvatarImage src={epic.assignee.avatar_url ?? undefined} />
          <AvatarFallback className="text-[8px] bg-white/20">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="truncate">{epic.title}</span>
      <span
        className={cn('ml-auto shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold', priorityClass)}
      >
        {epic.priority[0].toUpperCase()}
      </span>
    </div>
  )
}
