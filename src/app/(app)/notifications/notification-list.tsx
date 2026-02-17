'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { markAsRead, markAllAsRead } from '@/actions/notifications'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Bell,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  GitPullRequest,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

interface NotificationListProps {
  notifications: Notification[]
  userId: string
}

const typeIcons: Record<string, React.ElementType> = {
  issue_assigned: GitPullRequest,
  issue_updated: AlertTriangle,
  comment: MessageSquare,
  mention: MessageSquare,
  member_invited: UserPlus,
  issue_completed: CheckCircle2,
  default: Bell,
}

function getIcon(type: string) {
  return typeIcons[type] ?? typeIcons.default
}

export function NotificationList({ notifications, userId }: NotificationListProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead(userId)
      router.refresh()
    })
  }

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      await markAsRead(notificationId)
      router.refresh()
    })
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="divide-y p-0">
          {notifications.map((notification) => {
            const Icon = getIcon(notification.type)
            const content = (
              <div
                className={cn(
                  'flex items-start gap-4 p-4 transition-colors',
                  !notification.is_read && 'bg-accent/50',
                  notification.link && 'hover:bg-accent cursor-pointer'
                )}
                onClick={() => {
                  if (!notification.is_read) {
                    handleMarkRead(notification.id)
                  }
                }}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    notification.is_read
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-sm',
                        !notification.is_read && 'font-semibold'
                      )}
                    >
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {notification.message && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            )

            if (notification.link) {
              return (
                <Link
                  key={notification.id}
                  href={notification.link}
                  className="block"
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkRead(notification.id)
                    }
                  }}
                >
                  {content}
                </Link>
              )
            }

            return <div key={notification.id}>{content}</div>
          })}
        </CardContent>
      </Card>
    </div>
  )
}
