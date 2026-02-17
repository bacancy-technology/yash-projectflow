"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/constants";
import { getSiteUrl } from "@/lib/urls";
import { sendOrgInviteEmail } from "@/lib/email";
import type { OrganizationMember } from "@/types";

function invitePathFor(memberId: string) {
  return `/invite/${memberId}`;
}

export async function getMembers(orgId: string) {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("organization_members")
    .select("*, profiles(*)")
    .eq("org_id", orgId)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return members as OrganizationMember[];
}

export async function inviteMember(orgId: string, email: string, role: string) {
  const supabase = await createClient();
  const normalizedEmail = email.trim().toLowerCase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to invite members." };
  }

  // Verify the current user is an admin or owner
  const { data: currentMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
    return { error: "Only admins and owners can invite members." };
  }

  // Check plan member limits
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, slug, name")
    .eq("id", orgId)
    .single();

  if (!org) {
    return { error: "Organization not found." };
  }

  const plan = org.plan as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (memberCount !== null && memberCount >= limits.members) {
    return {
      error: `Your ${plan} plan is limited to ${limits.members} members. Please upgrade to invite more.`,
    };
  }

  // Check if member already exists (by email)
  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id")
    .eq("org_id", orgId)
    .ilike("invited_email", normalizedEmail)
    .maybeSingle();

  if (existingMember) {
    return { error: "This email has already been invited to the organization." };
  }

  // Check if a user with this email exists in profiles
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  // Also check if user is already a member by user_id
  if (existingProfile) {
    const { data: existingByUserId } = await supabase
      .from("organization_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existingByUserId) {
      return { error: "This user is already a member of the organization." };
    }
  }

  const now = new Date().toISOString();

  const memberData: Record<string, unknown> = {
    org_id: orgId,
    role,
    invited_email: normalizedEmail,
    invited_at: now,
    user_id: existingProfile ? existingProfile.id : null,
    accepted_at: existingProfile ? now : null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("organization_members")
    .insert(memberData)
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // Create notification for the invited user if they exist
  if (existingProfile) {
    await supabase.from("notifications").insert({
      user_id: existingProfile.id,
      org_id: orgId,
      type: "member_invited",
      title: "You were added to an organization",
      message: `You have been added as a ${role} to the organization.`,
      link: `/org/${org.slug}/members`,
    });
  }

  const memberId = inserted?.id as string | undefined;
  const inviteLink = memberId ? `${getSiteUrl()}${invitePathFor(memberId)}` : null;

  // Send an email only for pending invites (new users)
  if (!existingProfile && memberId) {
    const { data: inviter } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const emailResult = await sendOrgInviteEmail({
      to: normalizedEmail,
      orgName: org.name,
      role,
      inviteUrl: inviteLink ?? `${getSiteUrl()}${invitePathFor(memberId)}`,
      inviterName: inviter?.full_name ?? inviter?.email ?? user.email,
    });

    if (!emailResult.sent) {
      revalidatePath(`/org/${org.slug}/members`);
      return {
        kind: "invited" as const,
        success: true,
        emailSent: false,
        inviteLink,
        warning:
          emailResult.error ??
          "Invite created, but we could not send an email. Copy the invite link from the Members page.",
      };
    }
  }

  revalidatePath(`/org/${org.slug}/members`);
  return {
    kind: existingProfile ? ("added" as const) : ("invited" as const),
    success: true,
    emailSent: !existingProfile,
    inviteLink,
  };
}

export async function resendInvite(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to resend invites." };
  }

  const { data: invite } = await supabase
    .from("organization_members")
    .select(
      "id, org_id, invited_email, role, accepted_at, organizations:org_id(slug, name)"
    )
    .eq("id", memberId)
    .single();

  if (!invite) {
    return { error: "Invite not found." };
  }

  if (invite.accepted_at) {
    return { error: "This invite has already been accepted." };
  }

  if (!invite.invited_email) {
    return { error: "This invite has no email address." };
  }

  const { data: currentMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", invite.org_id)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
    return { error: "Only admins and owners can resend invites." };
  }

  const orgRef = invite.organizations as unknown as
    | { slug?: string; name?: string }
    | null;
  const orgSlug = orgRef?.slug;
  const inviteLink = `${getSiteUrl()}${invitePathFor(memberId)}`;

  const { data: inviter } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const emailResult = await sendOrgInviteEmail({
    to: invite.invited_email,
    orgName: orgRef?.name ?? "your organization",
    role: invite.role,
    inviteUrl: inviteLink,
    inviterName: inviter?.full_name ?? inviter?.email ?? user.email,
  });

  if (orgSlug) {
    revalidatePath(`/org/${orgSlug}/members`);
  }

  if (!emailResult.sent) {
    return {
      kind: "invited" as const,
      success: true,
      emailSent: false,
      inviteLink,
      warning:
        emailResult.error ??
        "Invite is still pending, but we could not send an email. Copy the invite link and share it manually.",
    };
  }

  return {
    kind: "invited" as const,
    success: true,
    emailSent: true,
    inviteLink,
  };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // Get the member to be removed
  const { data: member } = await supabase
    .from("organization_members")
    .select("*, organizations:org_id(slug)")
    .eq("id", memberId)
    .single();

  if (!member) {
    return { error: "Member not found." };
  }

  if (member.role === "owner") {
    return { error: "Cannot remove the organization owner." };
  }

  // Verify the current user is an admin or owner
  const { data: currentMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", member.org_id)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
    return { error: "Only admins and owners can remove members." };
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  const orgSlug = (member.organizations as unknown as { slug: string })?.slug;
  revalidatePath(`/org/${orgSlug}/members`);
  return { success: true };
}

export async function updateRole(memberId: string, newRole: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // Get the member
  const { data: member } = await supabase
    .from("organization_members")
    .select("*, organizations:org_id(slug)")
    .eq("id", memberId)
    .single();

  if (!member) {
    return { error: "Member not found." };
  }

  if (member.role === "owner") {
    return { error: "Cannot change the owner's role." };
  }

  if (newRole === "owner") {
    return { error: "Cannot assign the owner role." };
  }

  // Verify the current user is an admin or owner
  const { data: currentMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", member.org_id)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
    return { error: "Only admins and owners can change roles." };
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  const orgSlug = (member.organizations as unknown as { slug: string })?.slug;
  revalidatePath(`/org/${orgSlug}/members`);
  return { success: true };
}

export async function acceptInvite(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to accept an invite." };
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("id, org_id, user_id, invited_email, accepted_at, organizations:org_id(slug)")
    .eq("id", memberId)
    .single();

  if (!member) {
    return { error: "Invite not found." };
  }

  if (member.accepted_at) {
    return { error: "This invite has already been accepted." };
  }

  const invitedEmail = member.invited_email?.toLowerCase().trim();
  const userEmail = user.email?.toLowerCase().trim();

  if (invitedEmail && userEmail && invitedEmail !== userEmail) {
    return {
      error: `This invite was sent to ${member.invited_email}. You are signed in as ${user.email}.`,
    };
  }

  const { error } = await supabase
    .from("organization_members")
    .update({
      user_id: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  const orgSlug = (member.organizations as unknown as { slug: string })?.slug;
  revalidatePath(`/org/${orgSlug}/members`);
  return { success: true };
}
