'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { completeSprint } from '@/actions/sprints'
import type { Sprint } from '@/types'

interface SprintCompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sprint: Sprint
  incompleteCount: number
  hasNextSprint: boolean
}

export function SprintCompleteDialog({
  open,
  onOpenChange,
  sprint,
  incompleteCount,
  hasNextSprint,
}: SprintCompleteDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'backlog' | 'next_sprint'>('backlog')

  const handleComplete = async () => {
    setLoading(true)
    try {
      await completeSprint(sprint.id, action)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to complete sprint:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Complete Sprint</DialogTitle>
          <DialogDescription>
            Complete &quot;{sprint.name}&quot;
            {incompleteCount > 0
              ? `. ${incompleteCount} issue${incompleteCount !== 1 ? 's are' : ' is'} not done.`
              : '. All issues are done!'}
          </DialogDescription>
        </DialogHeader>

        {incompleteCount > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              What should happen with incomplete issues?
            </Label>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="backlog"
                  checked={action === 'backlog'}
                  onChange={() => setAction('backlog')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">Move to Backlog</span>
                  <p className="text-xs text-muted-foreground">
                    Issues will be unassigned from any sprint.
                  </p>
                </div>
              </label>

              {hasNextSprint && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="next_sprint"
                    checked={action === 'next_sprint'}
                    onChange={() => setAction('next_sprint')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">
                      Move to Next Sprint
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Issues will be moved to the next planned sprint.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? 'Completing...' : 'Complete Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
