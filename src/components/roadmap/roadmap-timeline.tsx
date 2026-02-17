'use client'

import { useState, useMemo, useRef } from 'react'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  eachMonthOfInterval,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { RoadmapHeader } from './roadmap-header'
import { RoadmapBar } from './roadmap-bar'
import { RoadmapFilters } from './roadmap-filters'
import { cn } from '@/lib/utils'
import type { Issue, Profile } from '@/types'

interface RoadmapTimelineProps {
  epics: Issue[]
  members: Profile[]
}

const MONTH_WIDTH = 160
const ROW_HEIGHT = 36

export function RoadmapTimeline({ epics, members }: RoadmapTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [rangeStart, setRangeStart] = useState(() => startOfMonth(subMonths(new Date(), 1)))
  const rangeEnd = useMemo(() => endOfMonth(addMonths(rangeStart, 5)), [rangeStart])

  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [colorBy, setColorBy] = useState<'priority' | 'status'>('priority')

  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
  const totalDays = differenceInDays(rangeEnd, rangeStart) || 1
  const totalWidth = months.length * MONTH_WIDTH

  const filteredEpics = useMemo(() => {
    return epics.filter((epic) => {
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(epic.priority)) {
        return false
      }
      if (selectedAssignee && epic.assignee_id !== selectedAssignee) {
        return false
      }
      return true
    })
  }, [epics, selectedPriorities, selectedAssignee])

  const navigateBack = () => setRangeStart((prev) => startOfMonth(subMonths(prev, 3)))
  const navigateForward = () => setRangeStart((prev) => startOfMonth(addMonths(prev, 3)))
  const navigateToday = () => setRangeStart(startOfMonth(subMonths(new Date(), 1)))

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <RoadmapFilters
          members={members}
          selectedPriorities={selectedPriorities}
          onPrioritiesChange={setSelectedPriorities}
          selectedAssignee={selectedAssignee}
          onAssigneeChange={setSelectedAssignee}
          colorBy={colorBy}
          onColorByChange={setColorBy}
        />
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div style={{ minWidth: 256 + totalWidth }}>
          <RoadmapHeader
            startDate={rangeStart}
            endDate={rangeEnd}
            monthWidth={MONTH_WIDTH}
          />

          {filteredEpics.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              {epics.length === 0
                ? 'No epics found. Create issues with type "Epic" to see them on the timeline.'
                : 'No epics match the current filters.'}
            </div>
          ) : (
            <div>
              {filteredEpics.map((epic, i) => (
                <div
                  key={epic.id}
                  className={cn(
                    'flex border-b border-border/40',
                    i % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  )}
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Label column */}
                  <div className="w-64 shrink-0 border-r px-3 flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-medium truncate">{epic.title}</span>
                    {epic.story_points != null && (
                      <span className="shrink-0 inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-primary/10 text-[10px] font-semibold text-primary px-1">
                        {epic.story_points}
                      </span>
                    )}
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative" style={{ width: totalWidth }}>
                    {/* Month gridlines */}
                    {months.map((month, mi) => (
                      <div
                        key={month.toISOString()}
                        className="absolute top-0 bottom-0 border-r border-border/20"
                        style={{ left: mi * MONTH_WIDTH, width: MONTH_WIDTH }}
                      />
                    ))}
                    <RoadmapBar
                      epic={epic}
                      timelineStart={rangeStart}
                      totalDays={totalDays}
                      totalWidth={totalWidth}
                      colorBy={colorBy}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
