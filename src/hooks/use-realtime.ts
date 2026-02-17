'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Issue, Sprint } from '@/types'

type RealtimeChangePayload = RealtimePostgresChangesPayload<Issue>
type RealtimeSprintPayload = RealtimePostgresChangesPayload<Sprint>

export function useRealtimeIssues(
  projectId: string,
  onUpdate: (payload: RealtimeChangePayload) => void
) {
  const callbackRef = useRef(onUpdate)

  useEffect(() => {
    callbackRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`issues:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimeChangePayload) => {
          callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])
}

export function useRealtimeSprints(
  projectId: string,
  onUpdate: (payload: RealtimeSprintPayload) => void
) {
  const callbackRef = useRef(onUpdate)

  useEffect(() => {
    callbackRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`sprints:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprints',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimeSprintPayload) => {
          callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])
}
