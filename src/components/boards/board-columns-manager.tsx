'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBoardColumn } from '@/actions/board-columns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrg } from '@/hooks/use-org'
import type { BoardColumn } from '@/types'

export function BoardColumnsManager({
  projectId,
  columns,
}: {
  projectId: string
  columns: BoardColumn[]
}) {
  const router = useRouter()
  const { memberRole } = useOrg()
  const canManage = memberRole === 'owner' || memberRole === 'admin'
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [isPending, startTransition] = useTransition()

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!canManage) return
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
      setName('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <form onSubmit={handleAddColumn} className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="new-column-name" className="sr-only">
              Column name
            </Label>
            <Input
              id="new-column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New column name"
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isPending}
              className="h-9 w-12 rounded-md border bg-background p-1"
              aria-label="Column color"
            />
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Adding…' : 'Add column'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only admins and owners can modify board columns.
        </p>
      )}

      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No columns configured.</p>
      ) : (
        <div className="space-y-2">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: column.color ?? '#6B7280' }}
                />
                <span className="text-sm font-medium truncate">
                  {column.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Position {column.position}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

