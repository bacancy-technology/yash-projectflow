'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createSprint, updateSprint } from '@/actions/sprints'
import type { Sprint } from '@/types'

interface SprintFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  sprint?: Sprint
}

export function SprintForm({
  open,
  onOpenChange,
  projectId,
  sprint,
}: SprintFormProps) {
  const router = useRouter()
  const isEdit = !!sprint
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(sprint?.name ?? '')
  const [goal, setGoal] = useState(sprint?.goal ?? '')
  const [startDate, setStartDate] = useState(sprint?.start_date ?? '')
  const [endDate, setEndDate] = useState(sprint?.end_date ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (isEdit && sprint) {
        await updateSprint(sprint.id, {
          name: name.trim(),
          goal: goal.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
        })
      } else {
        await createSprint(projectId, {
          name: name.trim(),
          goal: goal.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
        })
      }
      onOpenChange(false)
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sprint' : 'Create Sprint'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sprint-name">Sprint Name</Label>
            <Input
              id="sprint-name"
              placeholder="Sprint 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">Goal (optional)</Label>
            <Textarea
              id="sprint-goal"
              placeholder="What do you want to achieve in this sprint?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-start">Start Date</Label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-end">End Date</Label>
              <Input
                id="sprint-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
