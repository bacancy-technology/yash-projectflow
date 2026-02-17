'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatDuration } from './time-summary'
import type { Profile } from '@/types'

type TimeReportEntry = {
  user: Profile
  total_minutes: number
  issues: {
    issue_id: string
    issue_key: string
    title: string
    total_minutes: number
  }[]
}

interface TimeReportProps {
  data: TimeReportEntry[]
  orgSlug: string
  projectKey: string
}

export function TimeReport({ data, orgSlug, projectKey }: TimeReportProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const grandTotal = data.reduce((sum, entry) => sum + entry.total_minutes, 0)

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No time entries found for the selected period.
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Member</TableHead>
            <TableHead className="text-right">Time Logged</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => {
            const isExpanded = expandedUsers.has(entry.user.id)
            const initials = entry.user.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) ?? '?'

            return (
              <>
                <TableRow
                  key={entry.user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleUser(entry.user.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={entry.user.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {entry.user.full_name ?? entry.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatDuration(entry.total_minutes)}
                  </TableCell>
                </TableRow>
                {isExpanded &&
                  entry.issues.map((issue) => (
                    <TableRow key={`${entry.user.id}-${issue.issue_id}`}>
                      <TableCell className="pl-16">
                        <a
                          href={`/org/${orgSlug}/projects/${projectKey}/issues/${issue.issue_key}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="font-mono text-xs mr-2">
                            {issue.issue_key}
                          </span>
                          {issue.title}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {formatDuration(issue.total_minutes)}
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            )
          })}
          <TableRow className="font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right font-mono">
              {formatDuration(grandTotal)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
