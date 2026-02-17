import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/actions/projects";
import { getTimeEntriesForIssue } from "@/actions/time-entries";
import { getSprints } from "@/actions/sprints";
import { IssueEditButton } from "@/components/issues/issue-edit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TimeSummary } from "@/components/time-tracking/time-summary";
import { TimeEntryList } from "@/components/time-tracking/time-entry-list";
import { TimeEntryForm } from "@/components/time-tracking/time-entry-form";
import { PRIORITY_COLORS, ISSUE_TYPE_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BoardColumn, Issue, Profile } from "@/types";

interface IssueDetailPageProps {
  params: Promise<{ orgSlug: string; projectKey: string; issueKey: string }>;
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { orgSlug, projectKey, issueKey } = await params;
  const supabase = await createClient();

  // Parse issue key (e.g., "PROJ-123" -> number 123)
  const parts = issueKey.split("-");
  const issueNumber = parseInt(parts[parts.length - 1], 10);

  if (isNaN(issueNumber)) {
    notFound();
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    notFound();
  }

  const project = await getProject(org.id, projectKey);

  if (!project) {
    notFound();
  }

  const { data: issue } = await supabase
    .from("issues")
    .select(
      "*, assignee:profiles!issues_assignee_id_fkey(*), reporter:profiles!issues_reporter_id_fkey(*), labels:issue_labels(label:labels(*))"
    )
    .eq("project_id", project.id)
    .eq("issue_number", issueNumber)
    .single();

  if (!issue) {
    notFound();
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(*)")
    .eq("issue_id", issue.id)
    .order("created_at", { ascending: true });

  const { data: columns } = await supabase
    .from("board_columns")
    .select("*")
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  const { data: members } = await supabase
    .from("organization_members")
    .select("profiles(*)")
    .eq("org_id", org.id)
    .not("accepted_at", "is", null);

  type MemberWithProfile = { profiles: Profile | Profile[] | null };
  const memberProfiles: Profile[] = ((members ?? []) as MemberWithProfile[])
    .map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles))
    .filter((p): p is Profile => !!p);

  // Fetch sprints and time entries
  let sprints: Awaited<ReturnType<typeof getSprints>> = []
  try {
    sprints = await getSprints(project.id)
  } catch {
    // Sprints may not be available on free plan
  }
  const timeEntries = await getTimeEntriesForIssue(issue.id)
  const totalTimeMinutes = timeEntries.reduce((sum, e) => sum + e.duration_minutes, 0)

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const typedIssue = issue as Issue;
  const boardColumns = (columns ?? []) as BoardColumn[];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/org/${orgSlug}/projects/${projectKey}/board`}>
          <ChevronLeft className="size-4" />
          Back to Board
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {issueKey}
                </span>
                <Badge variant="outline" className="text-xs capitalize">
                  {ISSUE_TYPE_ICONS[typedIssue.type]} {typedIssue.type}
                </Badge>
              </div>
              <h2 className="text-xl font-bold">{typedIssue.title}</h2>
            </div>

            <IssueEditButton
              issue={typedIssue}
              columns={boardColumns}
              members={memberProfiles}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {typedIssue.description ? (
                <div
                  className="tiptap-content text-sm"
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof typedIssue.description === "string"
                        ? typedIssue.description
                        : String(typedIssue.description),
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No description provided.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comments ({comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!comments || comments.length === 0) ? (
                <p className="text-sm text-muted-foreground italic">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author?.full_name ?? comment.author?.email ?? "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{String(comment.content)}</p>
                      <Separator />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Status
                </p>
                <Badge variant="outline" className="capitalize">
                  {typedIssue.status}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Priority
                </p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize",
                    PRIORITY_COLORS[typedIssue.priority]
                  )}
                >
                  {typedIssue.priority}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Assignee
                </p>
                <p className="text-sm">
                  {typedIssue.assignee
                    ? typedIssue.assignee.full_name ?? typedIssue.assignee.email
                    : "Unassigned"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Reporter
                </p>
                <p className="text-sm">
                  {typedIssue.reporter
                    ? typedIssue.reporter.full_name ?? typedIssue.reporter.email
                    : "Unknown"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Due Date
                </p>
                <p className="text-sm">
                  {typedIssue.due_date
                    ? new Date(typedIssue.due_date).toLocaleDateString()
                    : "No due date"}
                </p>
              </div>

              <Separator />

              {typedIssue.story_points != null && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Story Points
                    </p>
                    <Badge variant="outline" className="font-mono">
                      {typedIssue.story_points}
                    </Badge>
                  </div>
                  <Separator />
                </>
              )}

              {sprints.length > 0 && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Sprint
                    </p>
                    <p className="text-sm">
                      {typedIssue.sprint_id
                        ? sprints.find((s) => s.id === typedIssue.sprint_id)?.name ?? 'Unknown'
                        : 'Backlog'}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Time Tracking
                </p>
                <TimeSummary totalMinutes={totalTimeMinutes} />
                <TimeEntryList
                  entries={timeEntries}
                  currentUserId={currentUser?.id ?? ''}
                />
                <TimeEntryForm issueId={issue.id} />
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Created
                </p>
                <p className="text-sm">
                  {new Date(typedIssue.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
