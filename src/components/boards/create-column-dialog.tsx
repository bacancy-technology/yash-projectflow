'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBoardColumn } from '@/actions/board-columns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateColumnDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName('')
      setColor('#6B7280')
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a column name.')
      return
    }

    startTransition(async () => {
      const result = await createBoardColumn(projectId, {
        name: name.trim(),
        color: color || null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Column added.')
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Name</Label>
            <Input
              id="column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blocked"
              autoFocus
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="column-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="column-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isPending}
                  className="h-9 w-12 rounded-md border bg-background p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isPending}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Adding…' : 'Add column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
