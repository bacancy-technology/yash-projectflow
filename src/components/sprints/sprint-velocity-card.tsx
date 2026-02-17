'use client'

import type { Sprint, Issue } from '@/types'

interface SprintVelocityCardProps {
  sprints: Sprint[]
  issues: Issue[]
  doneColumnIds: string[]
}

export function SprintVelocityCard({
  sprints,
  issues,
  doneColumnIds,
}: SprintVelocityCardProps) {
  const completedSprints = sprints
    .filter((s) => s.status === 'completed')
    .slice(0, 5)

  if (completedSprints.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No completed sprints yet.
      </div>
    )
  }

  const velocityData = completedSprints.map((sprint) => {
    const sprintIssues = issues.filter(
      (i) => i.sprint_id === sprint.id && doneColumnIds.includes(i.column_id)
    )
    const points = sprintIssues.reduce(
      (sum, i) => sum + (i.story_points ?? 0),
      0
    )
    return { sprint, points }
  })

  const maxPoints = Math.max(...velocityData.map((d) => d.points), 1)

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Velocity
      </h4>
      <div className="flex items-end gap-1.5 h-16">
        {velocityData.reverse().map(({ sprint, points }) => (
          <div
            key={sprint.id}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            <span className="text-[10px] font-mono text-muted-foreground">
              {points}
            </span>
            <div
              className="w-full rounded-sm bg-primary/20 min-h-[4px]"
              style={{
                height: `${Math.max((points / maxPoints) * 48, 4)}px`,
              }}
            />
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {sprint.name.length > 6
                ? sprint.name.slice(0, 5) + '…'
                : sprint.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
