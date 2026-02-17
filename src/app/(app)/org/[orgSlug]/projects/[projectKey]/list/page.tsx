import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/actions/projects";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PRIORITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types";

interface ListPageProps {
  params: Promise<{ orgSlug: string; projectKey: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}

export default async function ListPage({ params, searchParams }: ListPageProps) {
  const { orgSlug, projectKey } = await params;
  const { sort = "issue_number", order = "desc" } = await searchParams;
  const supabase = await createClient();

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

  const validSortCols = ["issue_number", "title", "status", "priority", "due_date"];
  const sortColumn = validSortCols.includes(sort) ? sort : "issue_number";
  const ascending = order === "asc";

  const { data: issues } = await supabase
    .from("issues")
    .select("*, assignee:profiles!issues_assignee_id_fkey(*)")
    .eq("project_id", project.id)
    .order(sortColumn, { ascending });

  function sortLink(column: string, label: string) {
    const nextOrder = sort === column && order === "asc" ? "desc" : "asc";
    const arrow =
      sort === column ? (order === "asc" ? " \u2191" : " \u2193") : "";
    return (
      <Link
        href={`/org/${orgSlug}/projects/${projectKey}/list?sort=${column}&order=${nextOrder}`}
        className="hover:text-foreground transition-colors"
      >
        {label}{arrow}
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      {(!issues || issues.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <h2 className="text-lg font-semibold">No issues yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create issues from the board view to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sortLink("issue_number", "Key")}</TableHead>
                <TableHead>{sortLink("title", "Title")}</TableHead>
                <TableHead>{sortLink("status", "Status")}</TableHead>
                <TableHead>{sortLink("priority", "Priority")}</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>{sortLink("due_date", "Due Date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue: Issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Link
                      href={`/org/${orgSlug}/projects/${projectKey}/issues/${projectKey}-${issue.issue_number}`}
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      {projectKey}-{issue.issue_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/org/${orgSlug}/projects/${projectKey}/issues/${projectKey}-${issue.issue_number}`}
                      className="font-medium hover:underline"
                    >
                      {issue.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs capitalize",
                        PRIORITY_COLORS[issue.priority]
                      )}
                    >
                      {issue.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {issue.assignee ? (
                      <span className="text-sm">
                        {issue.assignee.full_name ?? issue.assignee.email}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {issue.due_date ? (
                      <span className="text-sm">
                        {new Date(issue.due_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
