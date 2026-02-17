import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembers } from "@/actions/members";
import { MemberList } from "@/components/members/member-list";
import { InviteForm } from "@/components/members/invite-form";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanType } from "@/lib/constants";

interface MembersPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, plan")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    redirect("/");
  }

  // Get current user's membership
  const { data: currentMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!currentMember) {
    redirect("/");
  }

  const currentUserRole = currentMember.role as
    | "owner"
    | "admin"
    | "member"
    | "viewer";
  const canManage =
    currentUserRole === "owner" || currentUserRole === "admin";

  // Fetch all members
  const members = await getMembers(org.id);

  const plan = org.plan as PlanType;
  const memberLimit = PLAN_LIMITS[plan].members;
  const memberCount = members.length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage who has access to {org.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {memberCount}
            {memberLimit === Infinity
              ? " members"
              : ` / ${memberLimit} members`}
          </Badge>
          <Badge variant="outline" className="text-sm capitalize">
            {plan} plan
          </Badge>
        </div>
      </div>

      {canManage && (
        <InviteForm
          orgId={org.id}
          currentPlan={plan}
          currentMemberCount={memberCount}
        />
      )}

      <MemberList
        members={members}
        currentUserRole={currentUserRole}
        currentUserId={user.id}
        orgId={org.id}
      />
    </div>
  );
}
