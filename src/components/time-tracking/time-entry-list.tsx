'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteTimeEntry } from '@/actions/time-entries'
import { formatDuration } from './time-summary'
import type { TimeEntry } from '@/types'

interface TimeEntryListProps {
  entries: TimeEntry[]
  currentUserId: string
}

export function TimeEntryList({ entries, currentUserId }: TimeEntryListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (entries.length === 0) return null

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId)
    try {
      await deleteTimeEntry(entryId)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete time entry:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Show only last 5 entries inline
  const visibleEntries = entries.slice(0, 5)

  return (
    <div className="mt-2 space-y-1.5">
      {visibleEntries.map((entry) => {
        const initials = entry.user?.full_name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) ?? '?'

        return (
          <div key={entry.id} className="flex items-center gap-2 group">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={entry.user?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono font-medium">
                  {formatDuration(entry.duration_minutes)}
                </span>
                <span className="text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {entry.description && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {entry.description}
                </p>
              )}
            </div>
            {entry.user_id === currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        )
      })}
      {entries.length > 5 && (
        <p className="text-[11px] text-muted-foreground">
          +{entries.length - 5} more entries
        </p>
      )}
    </div>
  )
}
