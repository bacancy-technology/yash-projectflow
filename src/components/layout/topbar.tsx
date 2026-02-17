'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  CreditCard,
  FolderKanban,
  GitPullRequest,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useOrg } from '@/hooks/use-org'

interface TopbarProps {
  onToggleSidebar?: () => void
}

type ProjectRow = {
  id: string
  key: string
}

type IssueRow = {
  id: string
  issue_number: number
  title: string
  project_id: string
  updated_at: string
}

type IssueSearchResult = {
  id: string
  issue_number: number
  title: string
  projectKey: string
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile } = useUser()
  const { currentOrg } = useOrg()
  const { resolvedTheme, setTheme } = useTheme()
  const [notificationCount, setNotificationCount] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<IssueSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [orgProjects, setOrgProjects] = useState<ProjectRow[]>([])

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email?.charAt(0).toUpperCase() ?? '?'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Build breadcrumb
  const breadcrumbs: { label: string; href?: string }[] = []
  if (currentOrg) {
    breadcrumbs.push({
      label: currentOrg.name,
      href: `/org/${currentOrg.slug}/projects`,
    })
  }

  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count, error }) => {
        if (error) {
          console.error('Failed to load notifications:', error)
          return
        }
        setNotificationCount(count ?? 0)
      })
  }, [user])

  const projectsById = useMemo(
    () => new Map(orgProjects.map((p) => [p.id, p])),
    [orgProjects]
  )

  const projectsByKey = useMemo(
    () => new Map(orgProjects.map((p) => [p.key.toUpperCase(), p])),
    [orgProjects]
  )

  const projectRoute = useMemo(() => {
    const match = pathname.match(/^\/org\/([^/]+)\/projects\/([^/]+)/)
    if (!match) return null
    return { orgSlug: match[1], projectKey: match[2] }
  }, [pathname])

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open)
    if (!open) {
      setSearchQuery('')
      setSearchResults([])
      setSearchLoading(false)
    }
  }, [])

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim().length < 2) {
      setSearchResults([])
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        handleSearchOpenChange(!searchOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [handleSearchOpenChange, searchOpen])

  useEffect(() => {
    if (!currentOrg) return

    const supabase = createClient()
    supabase
      .from('projects')
      .select('id, key')
      .eq('org_id', currentOrg.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load projects for search:', error)
          return
        }
        setOrgProjects((data ?? []) as ProjectRow[])
      })
  }, [currentOrg])

  useEffect(() => {
    if (!searchOpen) return
    if (!currentOrg) return

    const q = searchQuery.trim()
    if (q.length < 2) return
    if (orgProjects.length === 0) return

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setSearchLoading(true)
      const supabase = createClient()

      try {
        const upper = q.toUpperCase()
        const keyMatch = upper.match(/^([A-Z0-9]{1,10})-(\d+)$/)

        if (keyMatch) {
          const projectKey = keyMatch[1]
          const issueNumber = Number.parseInt(keyMatch[2], 10)
          const project = projectsByKey.get(projectKey)

          if (project && Number.isFinite(issueNumber)) {
            const { data, error } = await supabase
              .from('issues')
              .select('id, issue_number, title, project_id, updated_at')
              .eq('project_id', project.id)
              .eq('issue_number', issueNumber)
              .maybeSingle()

            if (!cancelled) {
              if (error || !data) {
                setSearchResults([])
              } else {
                setSearchResults([
                  {
                    id: data.id,
                    issue_number: data.issue_number,
                    title: data.title,
                    projectKey: project.key,
                  },
                ])
              }
            }
            return
          }
        }

        const projectIds = orgProjects.map((p) => p.id)
        if (projectIds.length === 0) {
          if (!cancelled) setSearchResults([])
          return
        }

        const { data, error } = await supabase
          .from('issues')
          .select('id, issue_number, title, project_id, updated_at')
          .in('project_id', projectIds)
          .ilike('title', `%${q}%`)
          .order('updated_at', { ascending: false })
          .limit(20)

        if (cancelled) return
        if (error) {
          console.error('Issue search failed:', error)
          setSearchResults([])
          return
        }

        const results: IssueSearchResult[] = ((data ?? []) as IssueRow[])
          .map((issue) => {
            const projectKey = projectsById.get(issue.project_id)?.key
            if (!projectKey) return null
            return {
              id: issue.id,
              issue_number: issue.issue_number,
              title: issue.title,
              projectKey,
            } satisfies IssueSearchResult
          })
          .filter((r): r is IssueSearchResult => r !== null)

        setSearchResults(results)
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [
    currentOrg,
    orgProjects,
    projectsById,
    projectsByKey,
    searchOpen,
    searchQuery,
  ])

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const isDark = resolvedTheme === 'dark'
  const unreadCount = user ? notificationCount : 0

  return (
    <>
      <header
        className="flex items-center justify-between h-11 px-3 border-b bg-background"
        style={{ height: 'var(--topbar-height)' }}
      >
        {/* Left: mobile menu + breadcrumbs */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-7 w-7"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Center: search trigger */}
        <button
          className="hidden sm:flex items-center gap-2 h-7 px-3 rounded-md border bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors max-w-xs"
          onClick={() => handleSearchOpenChange(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search issues...</span>
          <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Right: search (mobile) + create + notifications + user */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:hidden"
            onClick={() => handleSearchOpenChange(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Create menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs bg-primary hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {projectRoute && (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/org/${projectRoute.orgSlug}/projects/${projectRoute.projectKey}/board?new=1`
                    )
                  }
                >
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  New issue
                </DropdownMenuItem>
              )}
              {currentOrg && (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/org/${currentOrg.slug}/projects/new`)
                  }
                >
                  <FolderKanban className="mr-2 h-4 w-4" />
                  New project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification Bell */}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="relative h-7 w-7"
              onClick={() => router.push('/notifications')}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <Badge
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            </Button>
          )}
          {unreadCount === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => router.push('/notifications')}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-7 w-7 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={profile?.avatar_url ?? undefined}
                    alt={profile?.full_name ?? 'User'}
                  />
                  <AvatarFallback className="text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name ?? 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  currentOrg
                    ? router.push(`/org/${currentOrg.slug}/settings`)
                    : router.push('/dashboard')
                }
              >
                <User className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog
        open={searchOpen}
        onOpenChange={handleSearchOpenChange}
        title="Search issues"
        description="Search issues across this organization"
      >
        <CommandInput
          placeholder={
            currentOrg ? 'Search issues by title or key (PROJ-123)...' : 'Select an organization first...'
          }
          value={searchQuery}
          onValueChange={handleSearchQueryChange}
          autoFocus
        />
        <CommandList>
          {!currentOrg && (
            <CommandEmpty>Select an organization to search.</CommandEmpty>
          )}

          {currentOrg && orgProjects.length === 0 && (
            <CommandEmpty>No projects yet — create a project first.</CommandEmpty>
          )}

          {currentOrg && orgProjects.length > 0 && (
            <>
              <CommandGroup heading="Issues">
                {searchLoading && (
                  <CommandItem disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </CommandItem>
                )}

                {!searchLoading && searchQuery.trim().length < 2 && (
                  <CommandItem disabled>Type at least 2 characters…</CommandItem>
                )}

                {!searchLoading &&
                  searchQuery.trim().length >= 2 &&
                  searchResults.length === 0 && (
                    <CommandItem disabled>No matching issues.</CommandItem>
                  )}

                {searchResults.map((issue) => {
                  const issueKey = `${issue.projectKey}-${issue.issue_number}`
                  return (
                    <CommandItem
                      key={issue.id}
                      value={`${issueKey} ${issue.title}`}
                      onSelect={() => {
                        if (!currentOrg) return
                        handleSearchOpenChange(false)
                        router.push(
                          `/org/${currentOrg.slug}/projects/${issue.projectKey}/issues/${issueKey}`
                        )
                      }}
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {issueKey}
                      </span>
                      <span className="truncate">{issue.title}</span>
                      <CommandShortcut>↵</CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Navigate">
                <CommandItem
                  onSelect={() => {
                    handleSearchOpenChange(false)
                    router.push(`/org/${currentOrg.slug}/projects`)
                  }}
                >
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    handleSearchOpenChange(false)
                    router.push(`/org/${currentOrg.slug}/members`)
                  }}
                >
                  <User className="h-4 w-4" />
                  Members
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    handleSearchOpenChange(false)
                    router.push(`/org/${currentOrg.slug}/settings/billing`)
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  Billing
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    handleSearchOpenChange(false)
                    router.push(`/org/${currentOrg.slug}/settings`)
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
