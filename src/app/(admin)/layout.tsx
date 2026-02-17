import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BarChart3,
  Building2,
  Users,
  CreditCard,
  Settings,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AdminTopbar } from '@/components/admin/admin-topbar'

const adminNavItems = [
  { label: 'Dashboard', icon: BarChart3, href: '/admin' },
  { label: 'Organizations', icon: Building2, href: '/admin/organizations' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Subscriptions', icon: CreditCard, href: '/admin/subscriptions' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!superAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Dark sidebar */}
      <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border">
          <Shield className="h-5 w-5 text-sidebar-primary shrink-0" />
          <span className="text-sm font-bold text-sidebar-foreground">Admin Panel</span>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-1">
          <nav className="space-y-0.5">
            {adminNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-sm px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Back to app */}
        <div className="p-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-sm px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
