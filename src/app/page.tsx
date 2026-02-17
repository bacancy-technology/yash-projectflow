import Link from "next/link";
import {
  Layers,
  KanbanSquare,
  Bug,
  Users,
  Radio,
  Workflow,
  Activity,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban Boards",
    description:
      "Visualize your workflow with drag-and-drop boards. Move tasks through custom stages effortlessly.",
  },
  {
    icon: Bug,
    title: "Issue Tracking",
    description:
      "Track bugs, tasks, and feature requests with powerful filtering, labels, and priority levels.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members, assign tasks, and keep everyone aligned with shared project views.",
  },
  {
    icon: Radio,
    title: "Real-time Updates",
    description:
      "See changes as they happen. No more refreshing or waiting for updates from your team.",
  },
  {
    icon: Workflow,
    title: "Custom Workflows",
    description:
      "Design workflows that match how your team actually works. Fully configurable issue states.",
  },
  {
    icon: Activity,
    title: "Activity Tracking",
    description:
      "Monitor project progress with detailed activity logs and at-a-glance status reports.",
  },
];

const stats = [
  { value: "1,000+", label: "Teams" },
  { value: "50,000+", label: "Projects managed" },
  { value: "2M+", label: "Issues resolved" },
  { value: "99.9%", label: "Uptime" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
                <Layers className="size-4" />
                The modern project management platform
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Manage Projects{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Like Never Before
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                Empower your team with intuitive project management. Plan sprints,
                track issues, and deliver products faster with real-time
                collaboration tools built for modern teams.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/pricing">See Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t bg-muted/20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to ship faster
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A complete toolkit for project management, from planning to
                delivery.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-t py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trusted by 1,000+ teams
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From startups to enterprises, teams rely on ProjectFlow to
                deliver their best work.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-xl sm:px-16 sm:py-20">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to streamline your workflow?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Join thousands of teams already using ProjectFlow to plan, track,
                and deliver projects on time.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                >
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
              <ul className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Free to start
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  No credit card required
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Cancel anytime
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
