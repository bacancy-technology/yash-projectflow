'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, List, Settings, Layers, GanttChart, Lock, Clock, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanType } from '@/lib/constants'

const tabs = [
  { label: 'Board', href: '/board', icon: LayoutGrid, freeOnly: true },
  { label: 'Backlog', href: '/backlog', icon: Inbox, proOnly: true },
  { label: 'Sprints', href: '/sprints', icon: Layers, proOnly: true },
  { label: 'List', href: '/list', icon: List },
  { label: 'Timeline', href: '/timeline', icon: GanttChart, proOnly: true },
  { label: 'Time Report', href: '/time-report', icon: Clock },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface ProjectTabsProps {
  basePath: string
  plan?: PlanType
}

export function ProjectTabs({ basePath, plan }: ProjectTabsProps) {
  const pathname = usePathname()
  const isFree = plan === 'free' || !plan

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        if (tab.freeOnly && !isFree) return null

        const href = `${basePath}${tab.href}`
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`)
        const Icon = tab.icon
        const locked = tab.proOnly && isFree

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40',
              isActive && 'border-primary text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            {tab.label}
            {locked && <Lock className="size-3 text-muted-foreground/50" />}
          </Link>
        )
      })}
    </nav>
  )
}
