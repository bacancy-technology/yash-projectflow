'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter } from 'lucide-react'
import { PRIORITIES } from '@/lib/constants'
import type { Profile } from '@/types'

interface RoadmapFiltersProps {
  members: Profile[]
  selectedPriorities: string[]
  onPrioritiesChange: (priorities: string[]) => void
  selectedAssignee: string | null
  onAssigneeChange: (assigneeId: string | null) => void
  colorBy: 'priority' | 'status'
  onColorByChange: (colorBy: 'priority' | 'status') => void
}

export function RoadmapFilters({
  members,
  selectedPriorities,
  onPrioritiesChange,
  selectedAssignee,
  onAssigneeChange,
  colorBy,
  onColorByChange,
}: RoadmapFiltersProps) {
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)

  const togglePriority = (p: string) => {
    if (selectedPriorities.includes(p)) {
      onPrioritiesChange(selectedPriorities.filter((v) => v !== p))
    } else {
      onPrioritiesChange([...selectedPriorities, p])
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Priority filter */}
      <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Filter className="mr-1.5 h-3 w-3" />
            Priority
            {selectedPriorities.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                {selectedPriorities.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="start">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedPriorities.includes(p)}
                onChange={() => togglePriority(p)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="capitalize">{p}</span>
            </label>
          ))}
          {selectedPriorities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-xs"
              onClick={() => onPrioritiesChange([])}
            >
              Clear
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Assignee filter */}
      <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Assignee
            {selectedAssignee && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                1
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <label
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
          >
            <input
              type="radio"
              name="assignee"
              checked={selectedAssignee === null}
              onChange={() => onAssigneeChange(null)}
              className="h-3.5 w-3.5"
            />
            All
          </label>
          {members.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
            >
              <input
                type="radio"
                name="assignee"
                checked={selectedAssignee === m.id}
                onChange={() => onAssigneeChange(m.id)}
                className="h-3.5 w-3.5"
              />
              <span className="truncate">{m.full_name ?? m.email}</span>
            </label>
          ))}
        </PopoverContent>
      </Popover>

      {/* Color-by toggle */}
      <div className="flex items-center rounded-md border">
        <button
          className={`px-2.5 py-1 text-xs font-medium rounded-l-md transition-colors ${
            colorBy === 'priority'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent'
          }`}
          onClick={() => onColorByChange('priority')}
        >
          Priority
        </button>
        <button
          className={`px-2.5 py-1 text-xs font-medium rounded-r-md transition-colors ${
            colorBy === 'status'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent'
          }`}
          onClick={() => onColorByChange('status')}
        >
          Status
        </button>
      </div>
    </div>
  )
}
