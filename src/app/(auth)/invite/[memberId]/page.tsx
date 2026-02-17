import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/actions/members";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InvitePageProps {
  params: Promise<{ memberId: string }>;
}

type OrgRef = { name: string; slug: string };

export default async function InvitePage({ params }: InvitePageProps) {
  const { memberId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invite } = await supabase
    .from("organization_members")
    .select(
      "id, invited_email, role, accepted_at, organizations:org_id(name, slug)"
    )
    .eq("id", memberId)
    .single();

  if (!invite) {
    notFound();
  }

  const org = invite.organizations as unknown as OrgRef | null;
  const next = `/invite/${memberId}`;

  if (invite.accepted_at && org?.slug) {
    redirect(`/org/${org.slug}/projects`);
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accept invite</CardTitle>
          <CardDescription>
            You were invited to join{" "}
            <span className="font-medium">{org?.name ?? "an organization"}</span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in (or create an account) with{" "}
            <span className="font-medium">
              {invite.invited_email ?? "the invited email"}
            </span>{" "}
            to accept this invite.
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(next)}`}>
                Sign in to accept
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/signup?next=${encodeURIComponent(next)}`}>
                Create account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  async function handleAccept() {
    "use server";
    const result = await acceptInvite(memberId);
    if (result.error) {
      throw new Error(result.error);
    }
    if (org?.slug) {
      redirect(`/org/${org.slug}/projects`);
    }
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept invite</CardTitle>
        <CardDescription>
          You were invited to join{" "}
          <span className="font-medium">{org?.name ?? "an organization"}</span>{" "}
          as <span className="font-medium">{invite.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleAccept} className="flex flex-col gap-2">
          <Button type="submit">Accept Invite</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Decline</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

