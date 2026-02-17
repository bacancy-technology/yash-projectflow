'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { OrgProvider } from '@/hooks/use-org'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Organization } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  orgs: Organization[]
}

export function AppShell({ children, orgs }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <OrgProvider initialOrgs={orgs}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div
          className="hidden md:flex shrink-0 transition-all duration-200 ease-in-out"
          style={{ width: sidebarCollapsed ? 56 : 240 }}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          />
        </div>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </OrgProvider>
  )
}
