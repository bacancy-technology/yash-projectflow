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
import { MoreHorizontal } from 'lucide-react'
import { updateOrgPlan } from '@/actions/admin'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const planStyles: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  enterprise: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  past_due: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
}

interface SubRow {
  id: string
  org_id: string
  plan: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  organization: { id: string; name: string; slug: string } | null
}

interface SubscriptionTableProps {
  subscriptions: SubRow[]
}

export function SubscriptionTable({ subscriptions }: SubscriptionTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [changePlanSub, setChangePlanSub] = useState<SubRow | null>(null)
  const [newPlan, setNewPlan] = useState('')

  const filtered = useMemo(() => {
    let result = subscriptions

    if (planFilter !== 'all') {
      result = result.filter((s) => s.plan === planFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter)
    }

    return result
  }, [subscriptions, planFilter, statusFilter])

  const handleChangePlan = async () => {
    if (!changePlanSub || !newPlan) return
    startTransition(async () => {
      try {
        await updateOrgPlan(changePlanSub.org_id, newPlan)
        router.refresh()
      } catch (err) {
        console.error('Failed to update plan:', err)
      } finally {
        setChangePlanSub(null)
        setNewPlan('')
      }
    })
  }

  const formatDate = (date: string | null) => {
    if (!date) return '--'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period Start</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.organization?.name ?? 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(planStyles[sub.plan] ?? '')}
                    >
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(statusStyles[sub.status] ?? '')}
                    >
                      {sub.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.current_period_start)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(sub.current_period_end)}
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
                          onClick={() => {
                            setChangePlanSub(sub)
                            setNewPlan(sub.plan)
                          }}
                        >
                          Change Plan
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

      {/* Change plan dialog */}
      <AlertDialog
        open={!!changePlanSub}
        onOpenChange={() => setChangePlanSub(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change Plan for {changePlanSub?.organization?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select a new plan for this subscription. This will take effect
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
