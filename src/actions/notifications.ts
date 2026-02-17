'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Notification } from '@/types'

export async function createNotification(params: {
  userId: string
  orgId?: string
  type: string
  title: string
  message?: string
  link?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      org_id: params.orgId ?? null,
      type: params.type,
      title: params.title,
      message: params.message ?? null,
      link: params.link ?? null,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as Notification }
}

export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return []
  }

  return (data as Notification[]) ?? []
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notifications')
  return { data: { success: true } }
}

export async function markAllAsRead(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notifications')
  return { data: { success: true } }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    return 0
  }

  return count ?? 0
}
