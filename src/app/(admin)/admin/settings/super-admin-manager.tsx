'use client'

import { useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { addSuperAdminByEmail, removeSuperAdmin } from '@/actions/admin'
import { useRouter } from 'next/navigation'

interface SuperAdmin {
  id: string
  user_id: string
  created_at: string
  profile: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

interface SuperAdminManagerProps {
  superAdmins: SuperAdmin[]
}

export function SuperAdminManager({ superAdmins }: SuperAdminManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!email.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await addSuperAdminByEmail(email.trim())
        setEmail('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add super admin')
      }
    })
  }

  const handleRemove = () => {
    if (!removeId) return
    startTransition(async () => {
      try {
        await removeSuperAdmin(removeId)
        router.refresh()
      } catch (err) {
        console.error('Failed to remove super admin:', err)
      } finally {
        setRemoveId(null)
      }
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="space-y-4">
      {/* Add new super admin */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Enter user email to add as super admin..."
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} disabled={isPending || !email.trim()}>
          {isPending ? 'Adding...' : 'Add'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Separator />

      {/* Current super admins list */}
      <div className="space-y-3">
        {superAdmins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No super admins configured.</p>
        ) : (
          superAdmins.map((sa) => (
            <div
              key={sa.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sa.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(
                      sa.profile?.full_name ?? null,
                      sa.profile?.email ?? ''
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {sa.profile?.full_name || 'Unnamed'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sa.profile?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Added {new Date(sa.created_at).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setRemoveId(sa.user_id)}
                  disabled={superAdmins.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Super Admin</AlertDialogTitle>
            <AlertDialogDescription>
              This user will lose access to the admin panel. They will still
              retain their regular account and organization memberships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
