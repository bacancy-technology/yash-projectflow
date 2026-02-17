import { createClient } from '@/lib/supabase/server'
import { getNotifications } from '@/actions/notifications'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/shared/empty-state'
import { BellOff } from 'lucide-react'
import { NotificationList } from './notification-list'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const notifications = await getNotifications(user.id, 50)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Stay up to date with activity across your organizations.
        </p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description="You are all caught up. Notifications will appear here when there is activity relevant to you."
        />
      ) : (
        <NotificationList
          notifications={notifications}
          userId={user.id}
        />
      )}
    </div>
  )
}
