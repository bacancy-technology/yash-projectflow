export const PLAN_LIMITS = {
  free: {
    projects: 3,
    members: 5,
    issuesPerProject: 100,
    labelsPerProject: 5,
    customWorkflows: false,
    activityLogDays: 7,
    prioritySupport: false,
    sprints: false,
    roadmap: false,
  },
  pro: {
    projects: Infinity,
    members: 20,
    issuesPerProject: Infinity,
    labelsPerProject: Infinity,
    customWorkflows: true,
    activityLogDays: 90,
    prioritySupport: false,
    sprints: true,
    roadmap: true,
  },
  enterprise: {
    projects: Infinity,
    members: Infinity,
    issuesPerProject: Infinity,
    labelsPerProject: Infinity,
    customWorkflows: true,
    activityLogDays: Infinity,
    prioritySupport: true,
    sprints: true,
    roadmap: true,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export const PLAN_PRICES = {
  free: 0,
  pro: 12,
  enterprise: 49,
} as const

export const ISSUE_TYPES = ['task', 'bug', 'story', 'epic'] as const
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const
export const MEMBER_ROLES = ['owner', 'admin', 'member', 'viewer'] as const

export const DEFAULT_COLUMNS = [
  { name: 'To Do', color: '#6B7280', position: 0 },
  { name: 'In Progress', color: '#3B82F6', position: 1 },
  { name: 'In Review', color: '#F59E0B', position: 2 },
  { name: 'Done', color: '#10B981', position: 3 },
]

export const PRIORITY_COLORS = {
  critical: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  high: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
  medium: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
  low: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
} as const

export const ISSUE_TYPE_ICONS = {
  task: '✓',
  bug: '🐛',
  story: '📖',
  epic: '⚡',
} as const

export const SPRINT_STATUSES = ['planning', 'active', 'completed'] as const
export const STORY_POINT_OPTIONS = [1, 2, 3, 5, 8, 13, 21] as const

export const ISSUE_TYPE_COLORS = {
  task: '#4B89DC',
  bug: '#E5493A',
  story: '#63BA3C',
  epic: '#904EE2',
} as const
