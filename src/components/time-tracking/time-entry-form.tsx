'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTimeEntry } from '@/actions/time-entries'
import { Plus, Loader2 } from 'lucide-react'

interface TimeEntryFormProps {
  issueId: string
}

export function TimeEntryForm({ issueId }: TimeEntryFormProps) {
  const router = useRouter()
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    const totalMinutes = h * 60 + m

    if (totalMinutes <= 0) return

    setLoading(true)
    try {
      await createTimeEntry(issueId, {
        duration_minutes: totalMinutes,
        description: description.trim() || null,
        date: date || null,
      })
      setHours('')
      setMinutes('')
      setDescription('')
      setDate('')
      setExpanded(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to log time:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
      >
        <Plus className="h-3 w-3" />
        Log time
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min="0"
          max="999"
          placeholder="0"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="h-7 w-14 text-xs text-center"
        />
        <span className="text-xs text-muted-foreground">h</span>
        <Input
          type="number"
          min="0"
          max="59"
          placeholder="0"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="h-7 w-14 text-xs text-center"
        />
        <span className="text-xs text-muted-foreground">m</span>
      </div>
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-7 text-xs"
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-7 text-xs"
      />
      <div className="flex items-center gap-1.5">
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Log'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setExpanded(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
