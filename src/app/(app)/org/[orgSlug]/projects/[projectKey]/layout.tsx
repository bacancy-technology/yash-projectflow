import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/actions/projects";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectMembers } from "@/components/projects/project-members";
import type { Profile } from "@/types";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; projectKey: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
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

  const project = await getProject(org.id, projectKey);

  if (!project) {
    notFound();
  }

  const { data: members } = await supabase
    .from("organization_members")
    .select("profiles(*)")
    .eq("org_id", org.id)
    .not("accepted_at", "is", null)
    .order("created_at", { ascending: true });

  type MemberWithProfile = { profiles: Profile | Profile[] | null };
  const memberProfiles: Profile[] = ((members ?? []) as MemberWithProfile[])
    .map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles))
    .filter((p): p is Profile => !!p);

  const basePath = `/org/${orgSlug}/projects/${projectKey}`;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="pt-4 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Link
              href={`/org/${orgSlug}/projects`}
              className="hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{project.name}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <span className="truncate">{project.name}</span>
                <span className="rounded-md border bg-background px-2 py-1 text-xs font-mono text-muted-foreground">
                  {project.key}
                </span>
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b bg-background/70 supports-[backdrop-filter]:bg-background/50">
          <ProjectTabs basePath={basePath} plan={org.plan as 'free' | 'pro' | 'enterprise'} />
          <ProjectMembers orgSlug={orgSlug} members={memberProfiles} />
        </div>
      </div>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
