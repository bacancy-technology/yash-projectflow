import Link from "next/link";
import {
  KanbanSquare,
  Bug,
  Users,
  Radio,
  ArrowRight,
  LayoutGrid,
  Tag,
  Filter,
  MessageSquare,
  UserPlus,
  Bell,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const featureSections = [
  {
    badge: "Visualize",
    title: "Kanban Boards",
    description:
      "Organize work visually with powerful drag-and-drop Kanban boards. Create custom columns to match your workflow, move issues between stages, and get a clear picture of progress at a glance.",
    highlights: [
      { icon: LayoutGrid, text: "Customizable columns and swimlanes" },
      { icon: Filter, text: "Filter by assignee, label, or priority" },
      { icon: Tag, text: "Color-coded labels for quick identification" },
    ],
  },
  {
    badge: "Track",
    title: "Issue Management",
    description:
      "Capture every bug, task, and feature request in one place. Add detailed descriptions with rich text, assign priorities, set due dates, and link related issues to keep everything connected.",
    highlights: [
      { icon: Bug, text: "Bug tracking with severity levels" },
      { icon: Tag, text: "Unlimited labels and custom fields" },
      { icon: Filter, text: "Advanced filtering and search" },
    ],
  },
  {
    badge: "Collaborate",
    title: "Team Collaboration",
    description:
      "Bring your entire team together. Invite members with role-based permissions, assign issues, leave comments, and keep everyone aligned with shared project views and notifications.",
    highlights: [
      { icon: UserPlus, text: "Role-based access control" },
      { icon: MessageSquare, text: "Threaded comments on issues" },
      { icon: Users, text: "Team dashboards and shared views" },
    ],
  },
  {
    badge: "Stay Updated",
    title: "Real-time Updates",
    description:
      "Never miss a beat. See changes the moment they happen with live updates across all your boards and issues. Get notified when tasks are assigned, completed, or need your attention.",
    highlights: [
      { icon: Zap, text: "Instant live synchronization" },
      { icon: Bell, text: "Smart notifications and alerts" },
      { icon: Radio, text: "Activity feed with full history" },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Built for the way you work
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every feature is designed to help your team plan, build, and deliver
            with less friction and more clarity.
          </p>
        </div>

        {/* Feature Sections - Alternating Layout */}
        <div className="mt-24 space-y-32">
          {featureSections.map((section, index) => (
            <div
              key={section.title}
              className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-16 ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text Content */}
              <div className="flex-1">
                <div className="inline-flex rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {section.badge}
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight">
                  {section.title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
                <ul className="mt-8 space-y-4">
                  {section.highlights.map((item) => (
                    <li key={item.text} className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <item.icon className="size-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Illustration Placeholder */}
              <div className="flex w-full flex-1 items-center justify-center">
                <div className="flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-xl border bg-muted/30 shadow-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-3 inline-flex rounded-xl bg-primary/10 p-4">
                      {index === 0 && (
                        <KanbanSquare className="size-10 text-primary" />
                      )}
                      {index === 1 && (
                        <Bug className="size-10 text-primary" />
                      )}
                      {index === 2 && (
                        <Users className="size-10 text-primary" />
                      )}
                      {index === 3 && (
                        <Radio className="size-10 text-primary" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {section.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Try ProjectFlow free and see the difference for yourself.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
