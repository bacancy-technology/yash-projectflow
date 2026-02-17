import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/actions/projects";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";

interface NewProjectPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewProjectPage({ params }: NewProjectPageProps) {
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

  const createProjectWithOrg = createProject.bind(null, org.id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/org/${orgSlug}/projects`}>
            <ChevronLeft className="size-4" />
            Back to Projects
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create Project</h1>
        <p className="text-muted-foreground">
          Set up a new project for {org.name}
        </p>
      </div>

      <ProjectForm action={createProjectWithOrg} submitLabel="Create Project" />
    </div>
  );
}
