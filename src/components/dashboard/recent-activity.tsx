"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import type { ActivityLog } from "@/types"

interface RecentActivityProps {
  activities: ActivityLog[]
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatAction(activity: ActivityLog): string {
  const userName = activity.user?.full_name || "Someone"
  const metadata = activity.metadata as Record<string, string> | null
  const issueKey = metadata?.issue_key || ""
  const issueTitle = metadata?.issue_title || ""
  const columnName = metadata?.column_name || ""
  const projectName = metadata?.project_name || ""

  switch (activity.action) {
    case "issue_created":
      return `${userName} created issue ${issueKey}${issueTitle ? ` "${issueTitle}"` : ""}`
    case "issue_updated":
      return `${userName} updated issue ${issueKey}`
    case "issue_moved":
      return `${userName} moved ${issueKey}${columnName ? ` to ${columnName}` : ""}`
    case "issue_assigned":
      return `${userName} assigned ${issueKey}${metadata?.assignee_name ? ` to ${metadata.assignee_name}` : ""}`
    case "issue_deleted":
      return `${userName} deleted issue ${issueKey}`
    case "comment_created":
      return `${userName} commented on ${issueKey}`
    case "comment_deleted":
      return `${userName} deleted a comment on ${issueKey}`
    case "project_created":
      return `${userName} created project ${projectName}`
    case "project_updated":
      return `${userName} updated project ${projectName}`
    case "member_invited":
      return `${userName} invited ${metadata?.invited_email || "a member"}`
    case "member_removed":
      return `${userName} removed a member`
    default:
      return `${userName} performed ${activity.action.replace(/_/g, " ")}`
  }
}

function ActionDot({ action }: { action: string }) {
  let colorClass = "bg-muted-foreground"

  if (action.includes("created")) colorClass = "bg-green-500"
  else if (action.includes("deleted") || action.includes("removed"))
    colorClass = "bg-red-500"
  else if (action.includes("moved") || action.includes("updated"))
    colorClass = "bg-blue-500"
  else if (action.includes("comment")) colorClass = "bg-yellow-500"
  else if (action.includes("assigned")) colorClass = "bg-purple-500"
  else if (action.includes("invited")) colorClass = "bg-teal-500"

  return (
    <span
      className={`absolute left-4 -translate-x-1/2 top-[22px] h-2 w-2 rounded-full ring-2 ring-background ${colorClass}`}
    />
  )
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {activities.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-3 pb-6 last:pb-0">
              <ActionDot action={activity.action} />

              <Avatar size="sm" className="relative z-10 shrink-0">
                {activity.user?.avatar_url && (
                  <AvatarImage
                    src={activity.user.avatar_url}
                    alt={activity.user.full_name || "User"}
                  />
                )}
                <AvatarFallback>
                  {getInitials(activity.user?.full_name ?? null)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm leading-snug">
                  {formatAction(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
