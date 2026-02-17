'use client'

import { useState } from 'react'
import { useOrg } from '@/hooks/use-org'
import { updateOrg, deleteOrg } from '@/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
	} from '@/components/ui/alert-dialog'

export default function OrgSettingsPage() {
  const { currentOrg, memberRole } = useOrg()
  const [name, setName] = useState(currentOrg?.name ?? '')
  const [slug, setSlug] = useState(currentOrg?.slug ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const isOwnerOrAdmin = memberRole === 'owner' || memberRole === 'admin'
  const isOwner = memberRole === 'owner'

  if (!isOwnerOrAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            You do not have permission to access organization settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentOrg) return
    setError(null)
    setSaving(true)

    try {
      const formData = new FormData()
      formData.set('name', name)
      formData.set('slug', slug)
      await updateOrg(currentOrg.id, formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentOrg) return
    setDeleting(true)

    try {
      await deleteOrg(currentOrg.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <form onSubmit={handleUpdate}>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your organization name and URL slug.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/org/</span>
                <Input
                  id="org-slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Organization</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all its data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Organization</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the organization <strong>{currentOrg?.name}</strong> and
                      all associated data including projects, issues, and members.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 py-2">
                    <Label htmlFor="confirm-name">
                      Type <strong>{currentOrg?.name}</strong> to confirm
                    </Label>
                    <Input
                      id="confirm-name"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={currentOrg?.name ?? ''}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={confirmName !== currentOrg?.name || deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? 'Deleting...' : 'Delete Organization'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
