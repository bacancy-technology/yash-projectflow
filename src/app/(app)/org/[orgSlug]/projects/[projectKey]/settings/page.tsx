import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject, updateProject, deleteProject } from "@/actions/projects";
import { ProjectForm } from "@/components/projects/project-form";
import { BoardColumnsManager } from "@/components/boards/board-columns-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BoardColumn, Label } from "@/types";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string; projectKey: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug, projectKey } = await params;
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

  // Fetch labels
  const { data: labels } = await supabase
    .from("labels")
    .select("*")
    .eq("project_id", project.id)
    .order("name", { ascending: true });

  // Fetch board columns
  const { data: columns } = await supabase
    .from("board_columns")
    .select("*")
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  const updateProjectWithId = updateProject.bind(null, project.id);
  const deleteProjectAction = async () => {
    'use server'
    await deleteProject(project.id)
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your project details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={updateProjectWithId}
            project={project}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>

      {/* Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
          <CardDescription>
            Manage labels for categorizing issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!labels || labels.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              No labels created yet.
            </p>
          ) : (
            <div className="space-y-2">
              {labels.map((label: Label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm font-medium">{label.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Board Columns */}
      <Card>
        <CardHeader>
          <CardTitle>Board Columns</CardTitle>
          <CardDescription>
            Configure the columns on your project board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BoardColumnsManager
            projectId={project.id}
            columns={(columns ?? []) as BoardColumn[]}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium">Delete this project</p>
              <p className="text-xs text-muted-foreground">
                This will permanently delete the project and all its issues, comments, and data.
              </p>
            </div>
            <form action={deleteProjectAction}>
              <Button variant="destructive" size="sm" type="submit">
                Delete Project
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
