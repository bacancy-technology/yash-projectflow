"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Eye,
  Trash2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { removeMember, resendInvite, updateRole } from "@/actions/members";
import { cn } from "@/lib/utils";
import type { OrganizationMember } from "@/types";

const ROLE_BADGE_STYLES: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: ShieldCheck,
  admin: Shield,
  member: Shield,
  viewer: Eye,
};

interface MemberListProps {
  members: OrganizationMember[];
  currentUserRole: OrganizationMember["role"] | null;
  currentUserId: string;
  orgId: string;
}

function getInitials(name: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

export function MemberList({
  members,
  currentUserRole,
  currentUserId,
}: MemberListProps) {
  const [isPending, startTransition] = useTransition();
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";

  const activeMembers = members.filter(
    (m) => m.accepted_at !== null || m.user_id !== null
  );
  const pendingInvites = members.filter(
    (m) => m.accepted_at === null && m.user_id === null
  );

  function handleRoleChange(memberId: string, newRole: string) {
    startTransition(async () => {
      const result = await updateRole(memberId, newRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated successfully.");
      }
    });
  }

  function handleRemoveMember() {
    if (!removingMemberId) return;
    startTransition(async () => {
      const result = await removeMember(removingMemberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member removed successfully.");
      }
      setRemovingMemberId(null);
    });
  }

  function copyInviteLink(memberId: string) {
    const url = `${window.location.origin}/invite/${memberId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Invite link copied."))
      .catch(() => toast.error("Failed to copy invite link."));
  }

  function handleResendInvite(memberId: string) {
    startTransition(async () => {
      const result = await resendInvite(memberId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.emailSent) {
        toast.success("Invite email sent.");
      } else {
        toast("Invite is still pending. Share the invite link.");
        toast("Copy invite link", {
          action: {
            label: "Copy",
            onClick: () => copyInviteLink(memberId),
          },
        });
      }

      if (result.warning) {
        toast(result.warning);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Active Members ({activeMembers.length})
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManageMembers && (
                  <TableHead className="w-[70px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManageMembers ? 4 : 3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No active members.
                  </TableCell>
                </TableRow>
              ) : (
                activeMembers.map((member) => {
                  const isCurrentUser = member.user_id === currentUserId;
                  const RoleIcon = ROLE_ICONS[member.role] || Shield;

                  return (
                    <TableRow
                      key={member.id}
                      className={cn(
                        isCurrentUser && "bg-muted/50"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="default">
                            <AvatarImage
                              src={member.profiles?.avatar_url || undefined}
                              alt={
                                member.profiles?.full_name ||
                                member.invited_email ||
                                "Member"
                              }
                            />
                            <AvatarFallback>
                              {getInitials(
                                member.profiles?.full_name ?? null,
                                member.profiles?.email || member.invited_email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {member.profiles?.full_name || "Unnamed User"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {member.profiles?.email || member.invited_email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize gap-1",
                            ROLE_BADGE_STYLES[member.role]
                          )}
                        >
                          <RoleIcon className="size-3" />
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.accepted_at
                          ? format(new Date(member.accepted_at), "MMM d, yyyy")
                          : format(new Date(member.created_at), "MMM d, yyyy")}
                      </TableCell>
                      {canManageMembers && (
                        <TableCell>
                          {member.role !== "owner" && !isCurrentUser ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  disabled={isPending}
                                >
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRoleChange(member.id, "admin")
                                  }
                                  disabled={member.role === "admin"}
                                >
                                  <Shield className="size-4 mr-2" />
                                  Set as Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRoleChange(member.id, "member")
                                  }
                                  disabled={member.role === "member"}
                                >
                                  <Shield className="size-4 mr-2" />
                                  Set as Member
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRoleChange(member.id, "viewer")
                                  }
                                  disabled={member.role === "viewer"}
                                >
                                  <Eye className="size-4 mr-2" />
                                  Set as Viewer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setRemovingMemberId(member.id)
                                  }
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Pending Invites ({pendingInvites.length})
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  {canManageMembers && (
                    <TableHead className="w-[70px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="default">
                          <AvatarFallback>
                            <Mail className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none truncate">
                            {member.invited_email}
                          </p>
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                          >
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "capitalize",
                          ROLE_BADGE_STYLES[member.role]
                        )}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.invited_at
                        ? format(new Date(member.invited_at), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={isPending}
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => copyInviteLink(member.id)}
                            >
                              <Mail className="size-4 mr-2" />
                              Copy invite link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(member.id)}
                              disabled={isPending}
                            >
                              <Mail className="size-4 mr-2" />
                              Resend email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRemovingMemberId(member.id)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Revoke Invite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={removingMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setRemovingMemberId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? They will lose access
              to the organization and all its projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
