import {
  Avatar as AvatarRoot,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: Pick<Profile, 'full_name' | 'avatar_url'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sizeMap = {
  sm: 'sm' as const,
  md: 'default' as const,
  lg: 'lg' as const,
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  return (
    <AvatarRoot size={sizeMap[size]} className={cn(className)}>
      {user.avatar_url && (
        <AvatarImage src={user.avatar_url} alt={user.full_name ?? 'User'} />
      )}
      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
    </AvatarRoot>
  )
}
