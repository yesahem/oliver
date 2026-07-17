import Link from "next/link";
import { FolderGit2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/components/card";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";

// The project list must be fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function DashboardPage() {
  let projects: Project[] = [];
  let loadError: string | null = null;
  try {
    projects = await api.listProjects();
  } catch {
    loadError =
      "Could not reach the backend. Is it running on port 4000 (bun run dev)?";
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Oliver</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-generated projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {loadError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          {loadError}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <FolderGit2 className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No projects yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
              <Card className="h-full transition-colors hover:border-ring/60 hover:bg-accent/40">
                <CardHeader>
                  <CardTitle className="truncate text-base">
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    Created {dateFormat.format(new Date(project.createdAt))}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
