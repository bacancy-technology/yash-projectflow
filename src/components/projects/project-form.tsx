"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types";

interface ProjectFormProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean } | void>;
  project?: Project | null;
  submitLabel?: string;
}

function generateKey(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 5);
}

export function ProjectForm({
  action,
  project,
  submitLabel = "Create Project",
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [key, setKey] = useState(project?.key ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setName(newName);
      if (!project) {
        setKey(generateKey(newName));
      }
    },
    [project]
  );

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={handleNameChange}
          placeholder="My Awesome Project"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="key">Project Key</Label>
        <Input
          id="key"
          name="key"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 5))}
          placeholder="MAP"
          maxLength={5}
          required
          className="font-mono uppercase"
        />
        <p className="text-xs text-muted-foreground">
          Used as the prefix for issue keys (e.g., {key || "KEY"}-1, {key || "KEY"}-2).
          Max 5 characters.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of your project..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
