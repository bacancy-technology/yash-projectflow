import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";

interface ProjectsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  const projects = await getProjects(org.id);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage projects for {org.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${orgSlug}/projects/new`}>
            <Plus className="size-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <FolderKanban className="size-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to start tracking issues.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/org/${orgSlug}/projects/new`}>
              <Plus className="size-4" />
              Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              orgSlug={orgSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
