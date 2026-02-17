'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Search, Trash2, ArrowUpDown } from 'lucide-react'
import { updateOrgPlan, deleteOrgAdmin } from '@/actions/admin'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const planStyles: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  enterprise: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
}

interface OrgRow {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
  owner: { id: string; full_name: string | null; email: string } | null
  subscription: { plan: string; status: string } | null
  memberCount: number
  projectCount: number
}

interface OrgTableProps {
  organizations: OrgRow[]
}

type SortKey = 'name' | 'created_at' | 'memberCount' | 'projectCount'

export function OrgTable({ organizations }: OrgTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [changePlanOrg, setChangePlanOrg] = useState<OrgRow | null>(null)
  const [newPlan, setNewPlan] = useState('')

  const filtered = useMemo(() => {
    let result = organizations

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.slug.toLowerCase().includes(q) ||
          o.owner?.email?.toLowerCase().includes(q)
      )
    }

    if (planFilter !== 'all') {
      result = result.filter((o) => o.plan === planFilter)
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'created_at')
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      else if (sortKey === 'memberCount') cmp = a.memberCount - b.memberCount
      else if (sortKey === 'projectCount') cmp = a.projectCount - b.projectCount
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [organizations, search, planFilter, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    startTransition(async () => {
      try {
        await deleteOrgAdmin(deleteId)
        router.refresh()
      } catch (err) {
        console.error('Failed to delete org:', err)
      } finally {
        setDeleteId(null)
      }
    })
  }

  const handleChangePlan = async () => {
    if (!changePlanOrg || !newPlan) return
    startTransition(async () => {
      try {
        await updateOrgPlan(changePlanOrg.id, newPlan)
        router.refresh()
      } catch (err) {
        console.error('Failed to update plan:', err)
      } finally {
        setChangePlanOrg(null)
        setNewPlan('')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => toggleSort('name')}
                >
                  Name <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => toggleSort('memberCount')}
                >
                  Members <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => toggleSort('projectCount')}
                >
                  Projects <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3"
                  onClick={() => toggleSort('created_at')}
                >
                  Created <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                  <TableCell>
                    {org.owner?.full_name || org.owner?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(planStyles[org.plan] ?? '')}
                    >
                      {org.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{org.memberCount}</TableCell>
                  <TableCell>{org.projectCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`/org/${org.slug}/projects`, '_blank')
                          }
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setChangePlanOrg(org)
                            setNewPlan(org.plan)
                          }}
                        >
                          Change Plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(org.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              organization and all associated data including projects, issues, and
              members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change plan dialog */}
      <AlertDialog
        open={!!changePlanOrg}
        onOpenChange={() => setChangePlanOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change Plan for {changePlanOrg?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select a new plan for this organization. This will take effect
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePlan} disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
