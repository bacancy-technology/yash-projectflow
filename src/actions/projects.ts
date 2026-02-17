"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_COLUMNS, PLAN_LIMITS } from "@/lib/constants";
import type { Project } from "@/types";

export async function getProjects(orgId: string) {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, issues:issues(count)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return projects.map((project: Project & { issues: { count: number }[] }) => ({
    ...project,
    issue_count: project.issues?.[0]?.count ?? 0,
  }));
}

export async function getProject(orgId: string, projectKey: string) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgId)
    .eq("key", projectKey)
    .single();

  if (error) {
    return null;
  }

  return project as Project;
}

export async function createProject(orgId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a project." };
  }

  const name = formData.get("name") as string;
  const key = formData.get("key") as string;
  const description = (formData.get("description") as string) || null;

  if (!name || !key) {
    return { error: "Project name and key are required." };
  }

  // Check plan limits
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();

  if (!org) {
    return { error: "Organization not found." };
  }

  const plan = org.plan as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (projectCount !== null && projectCount >= limits.projects) {
    return {
      error: `Your ${plan} plan is limited to ${limits.projects} projects. Please upgrade to create more.`,
    };
  }

  // Check for duplicate key
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("org_id", orgId)
    .eq("key", key.toUpperCase())
    .single();

  if (existing) {
    return { error: "A project with this key already exists in the organization." };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      org_id: orgId,
      name,
      key: key.toUpperCase(),
      description,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create default board columns
  const columns = DEFAULT_COLUMNS.map((col) => ({
    project_id: project.id,
    name: col.name,
    color: col.color,
    position: col.position,
  }));

  const { error: columnsError } = await supabase
    .from("board_columns")
    .insert(columns);

  if (columnsError) {
    // Rollback project creation
    await supabase.from("projects").delete().eq("id", project.id);
    return { error: "Failed to create default board columns." };
  }

  // Get org slug for redirect
  const { data: orgData } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();

  revalidatePath(`/org/${orgData?.slug}/projects`);
  redirect(`/org/${orgData?.slug}/projects/${project.key}/board`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const key = formData.get("key") as string;
  const description = (formData.get("description") as string) || null;

  if (!name || !key) {
    return { error: "Project name and key are required." };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      key: key.toUpperCase(),
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("org_id, key")
    .eq("id", projectId)
    .single();

  if (!project) {
    return { error: "Project not found." };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", project.org_id)
    .single();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/org/${org?.slug}/projects`);
  redirect(`/org/${org?.slug}/projects`);
}
