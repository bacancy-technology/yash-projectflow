"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteMember } from "@/actions/members";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanType } from "@/lib/constants";

interface InviteFormProps {
  orgId: string;
  currentPlan: PlanType;
  currentMemberCount: number;
}

export function InviteForm({
  orgId,
  currentPlan,
  currentMemberCount,
}: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isPending, startTransition] = useTransition();

  const memberLimit = PLAN_LIMITS[currentPlan].members;
  const isAtLimit =
    memberLimit !== Infinity && currentMemberCount >= memberLimit;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address.");
      return;
    }

    if (isAtLimit) {
      toast.error(
        `Your ${currentPlan} plan is limited to ${memberLimit} members. Please upgrade to invite more.`
      );
      return;
    }

    startTransition(async () => {
      const result = await inviteMember(orgId, email.trim(), role);

      if (result.error) {
        toast.error(result.error);
      } else {
        const inviteLink =
          typeof result.inviteLink === "string" ? result.inviteLink : null;

        const copyAction = inviteLink
          ? {
              label: "Copy link",
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink);
                  toast.success("Invite link copied.");
                } catch {
                  toast.error("Failed to copy invite link.");
                }
              },
            }
          : undefined;

        if (result.kind === "added") {
          toast.success(`Member added: ${email.trim()}.`);
        } else if (result.emailSent) {
          toast.success(`Invite email sent to ${email.trim()}.`, {
            action: copyAction,
          });
        } else {
          toast("Invite created. Share the invite link.", {
            action: copyAction,
          });
        }

        if (result.warning) {
          toast(result.warning);
        }

        setEmail("");
        setRole("member");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="size-4" />
          Invite Member
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="invite-email"
              className="text-sm font-medium mb-1.5 block"
            >
              Email address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending || isAtLimit}
              required
            />
          </div>
          <div className="w-[140px]">
            <label
              htmlFor="invite-role"
              className="text-sm font-medium mb-1.5 block"
            >
              Role
            </label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isPending || isAtLimit}
            >
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending || isAtLimit}>
            {isPending ? "Inviting..." : "Invite"}
          </Button>
        </form>
        {isAtLimit && (
          <p className="text-sm text-destructive mt-3">
            You have reached the member limit for the {currentPlan} plan (
            {memberLimit} members). Upgrade your plan to invite more members.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
