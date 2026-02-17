import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/actions/projects";
import { KanbanBoard } from "@/components/boards/kanban-board";
import { PLAN_LIMITS, type PlanType } from "@/lib/constants";
import type { BoardColumnWithIssues, Issue, Label, Profile } from "@/types";

interface BoardPageProps {
  params: Promise<{ orgSlug: string; projectKey: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { orgSlug, projectKey } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    notFound();
  }

  // Redirect Pro/Enterprise users to sprints (board is built into sprint view)
  const plan = (org.plan && org.plan in PLAN_LIMITS ? org.plan : "free") as PlanType;
  if (PLAN_LIMITS[plan].sprints) {
    redirect(`/org/${orgSlug}/projects/${projectKey}/sprints`);
  }

  const project = await getProject(org.id, projectKey);

  if (!project) {
    notFound();
  }

  // Fetch board columns with issues
  const { data: columns } = await supabase
    .from("board_columns")
    .select("*")
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  const { data: issues } = await supabase
    .from("issues")
    .select(
      "*, assignee:profiles!issues_assignee_id_fkey(*), reporter:profiles!issues_reporter_id_fkey(*), issue_labels:issue_labels(label:labels(*))"
    )
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  type IssueWithJoins = Issue & {
    issue_labels?: { label: Label | null }[] | null;
  };

  const normalizedIssues: Issue[] = ((issues ?? []) as IssueWithJoins[]).map(
    ({ issue_labels, ...rest }) => ({
      ...rest,
      labels: (issue_labels ?? [])
        .map((row) => row.label)
        .filter((label): label is Label => !!label),
    })
  );

  // Fetch org members for assignee selection
  const { data: members } = await supabase
    .from("organization_members")
    .select("profiles(*)")
    .eq("org_id", org.id)
    .not("accepted_at", "is", null);

  type MemberWithProfile = { profiles: Profile | Profile[] | null };
  const memberProfiles: Profile[] = ((members ?? []) as MemberWithProfile[])
    .map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles))
    .filter((p): p is Profile => !!p);

  // Group issues by column
  const columnsWithIssues: BoardColumnWithIssues[] = (columns ?? []).map(
    (column) => ({
      ...column,
      issues: normalizedIssues.filter((issue) => issue.column_id === column.id),
    })
  );

  return (
    <KanbanBoard
      columns={columnsWithIssues}
      projectId={project.id}
      orgSlug={orgSlug}
      projectKey={projectKey}
      members={memberProfiles}
    />
  );
}
