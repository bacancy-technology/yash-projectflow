'use client'

import { cn } from '@/lib/utils'

interface UsageWarningProps {
  current: number
  limit: number
  feature: string
  className?: string
}

export function UsageWarning({
  current,
  limit,
  feature,
  className,
}: UsageWarningProps) {
  if (limit === Infinity) return null

  const percentage = (current / limit) * 100

  if (percentage < 80) return null

  const isAtLimit = percentage >= 100
  const isWarning = percentage >= 80 && percentage < 100

  return (
    <div
      className={cn(
        'rounded-md px-4 py-3 text-sm',
        isAtLimit && 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        isWarning && 'bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
        className
      )}
    >
      {isAtLimit ? (
        <p>
          You have reached the limit of <strong>{limit}</strong> {feature} on
          your current plan. Please upgrade to add more.
        </p>
      ) : (
        <p>
          You are using <strong>{current}</strong> of <strong>{limit}</strong>{' '}
          {feature} on your current plan ({Math.round(percentage)}%).
        </p>
      )}
    </div>
  )
}
