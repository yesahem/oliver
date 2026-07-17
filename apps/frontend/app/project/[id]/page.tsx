import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof api.getProject>>;
  try {
    data = await api.getProject(id);
  } catch {
    notFound();
  }

  return <WorkspaceLayout project={data.project} fileTree={data.fileTree} />;
}
