'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlanBadge } from '@/components/billing/plan-badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useOrg } from '@/hooks/use-org'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', requiresOrg: false },
  { label: 'Projects', icon: FolderKanban, path: '/projects', requiresOrg: true },
  { label: 'Members', icon: Users, path: '/members', requiresOrg: true },
]

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { currentOrg } = useOrg()

  const navLink = (item: typeof navItems[number], isActive: boolean, href: string) => {
    const content = (
      <Link
        key={item.label}
        href={href}
        className={cn(
          'flex items-center gap-3 px-2.5 py-1.5 text-sm font-medium transition-colors rounded-sm relative',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-sidebar-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-2 px-3 py-3 border-b border-sidebar-border', collapsed && 'justify-center px-0')}>
          <FolderKanban className="h-5 w-5 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="text-sm font-bold text-sidebar-foreground">ProjectFlow</span>}
        </div>

        {/* Organization */}
        {currentOrg && (
          <div className={cn('px-2 py-2', collapsed && 'px-1')}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center h-8 w-full rounded-sm">
                    <Building2 className="h-4 w-4 text-sidebar-foreground/70" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {currentOrg.name}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2 h-8 px-2.5 rounded-sm bg-sidebar-accent/30 text-xs text-sidebar-foreground">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate font-medium">{currentOrg.name}</span>
                <PlanBadge plan={currentOrg.plan} className="ml-auto text-xs" />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className={cn('flex-1 px-2 py-1', collapsed && 'px-1')}>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const href = item.requiresOrg
                ? currentOrg
                  ? `/org/${currentOrg.slug}${item.path}`
                  : '/dashboard'
                : item.path

              const isActive = item.requiresOrg
                ? currentOrg
                  ? pathname.startsWith(`/org/${currentOrg.slug}${item.path}`)
                  : false
                : pathname === item.path

              return navLink(item, isActive, href)
            })}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <div className="p-2 border-t border-sidebar-border">
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full h-7 rounded-sm hover:bg-sidebar-accent/50 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
