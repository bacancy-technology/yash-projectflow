'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ISSUE_TYPES, PRIORITIES, ISSUE_TYPE_ICONS } from '@/lib/constants'
import { Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

export interface FilterState {
  type?: string[]
  priority?: string[]
  assignee_id?: string
  search?: string
}

interface IssueFiltersProps {
  members?: Profile[]
  labels?: { id: string; name: string; color: string }[]
  onChange: (filters: FilterState) => void
}

export function IssueFilters({ members, labels, onChange }: IssueFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [search, setSearch] = useState('')

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onChange(updated)
  }

  const toggleArrayFilter = (
    key: 'type' | 'priority',
    value: string
  ) => {
    const current = filters[key] ?? []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateFilters({ [key]: next.length > 0 ? next : undefined })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    updateFilters({ search: value || undefined })
  }

  const activeFilterCount =
    (filters.type?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.assignee_id ? 1 : 0)

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    onChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background/70 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 pl-8 text-sm bg-background"
        />
      </div>

      {/* Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1',
              filters.type && filters.type.length > 0 && 'border-primary text-primary'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Type
            {filters.type && filters.type.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {filters.type.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {ISSUE_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={filters.type?.includes(type) ?? false}
                  onChange={() => toggleArrayFilter('type', type)}
                  className="rounded"
                />
                <span>{ISSUE_TYPE_ICONS[type]}</span>
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Priority Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1',
              filters.priority &&
                filters.priority.length > 0 &&
                'border-primary text-primary'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Priority
            {filters.priority && filters.priority.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {filters.priority.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {PRIORITIES.map((priority) => (
              <label
                key={priority}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={filters.priority?.includes(priority) ?? false}
                  onChange={() => toggleArrayFilter('priority', priority)}
                  className="rounded"
                />
                <span className="capitalize">{priority}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Assignee Filter */}
      {members && members.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-1',
                filters.assignee_id && 'border-primary text-primary'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Assignee
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              <label
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => updateFilters({ assignee_id: undefined })}
              >
                <input
                  type="radio"
                  name="assignee"
                  checked={!filters.assignee_id}
                  readOnly
                />
                <span>All</span>
              </label>
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() =>
                    updateFilters({ assignee_id: member.id })
                  }
                >
                  <input
                    type="radio"
                    name="assignee"
                    checked={filters.assignee_id === member.id}
                    readOnly
                  />
                  <span className="truncate">
                    {member.full_name ?? member.email}
                  </span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {activeFilterCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-5" />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </>
      )}
    </div>
  )
}
