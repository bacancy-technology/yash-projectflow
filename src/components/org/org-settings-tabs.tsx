'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'General', href: '', icon: Settings },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

export function OrgSettingsTabs({ basePath }: { basePath: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const href = tab.href ? `${basePath}${tab.href}` : basePath
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        const Icon = tab.icon

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40',
              isActive && 'border-primary text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

