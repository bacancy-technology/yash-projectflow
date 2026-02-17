'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

function initialsFor(member: Profile) {
  if (member.full_name) {
    return member.full_name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return member.email?.charAt(0).toUpperCase() ?? '?'
}

export function ProjectMembers({
  orgSlug,
  members,
  className,
  maxVisible = 6,
}: {
  orgSlug: string
  members: Profile[]
  className?: string
  maxVisible?: number
}) {
  const router = useRouter()

  const { visible, extra } = useMemo(() => {
    const unique = new Map(members.map((m) => [m.id, m]))
    const list = Array.from(unique.values())
    return {
      visible: list.slice(0, maxVisible),
      extra: Math.max(0, list.length - maxVisible),
    }
  }, [maxVisible, members])

  if (members.length === 0) return null

  return (
    <button
      type="button"
      onClick={() => router.push(`/org/${orgSlug}/members`)}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50',
        className
      )}
      aria-label="Open organization members"
      title="Open members"
    >
      <span className="hidden md:inline">Members</span>
      <AvatarGroup className="group/avatar-group">
        {visible.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <Avatar size="sm" className="cursor-pointer">
                <AvatarImage
                  src={member.avatar_url ?? undefined}
                  alt={member.full_name ?? member.email}
                />
                <AvatarFallback>{initialsFor(member)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {member.full_name ?? member.email}
            </TooltipContent>
          </Tooltip>
        ))}

        {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
      </AvatarGroup>
    </button>
  )
}

