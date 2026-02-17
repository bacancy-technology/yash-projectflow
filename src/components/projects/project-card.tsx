import Link from "next/link";
import { FolderKanban } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project & { issue_count: number };
  orgSlug: string;
}

export function ProjectCard({ project, orgSlug }: ProjectCardProps) {
  return (
    <Link href={`/org/${orgSlug}/projects/${project.key}/board`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {project.name}
              </CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs font-mono">
                {project.key}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project.description ? (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          ) : (
            <CardDescription className="italic">
              No description
            </CardDescription>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {project.issue_count} {project.issue_count === 1 ? "issue" : "issues"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
