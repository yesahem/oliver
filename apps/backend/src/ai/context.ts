import { prisma, type ChatMessage, type File, type Project } from "db";

const HISTORY_LIMIT = 10;

export interface ProjectContext {
  project: Project;
  files: File[];
  history: ChatMessage[];
}

// MVP context: the whole project plus the last few chat messages.
// Smarter retrieval is Spec 05.
export async function buildProjectContext(
  projectId: string,
): Promise<ProjectContext | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;

  const [files, historyDesc] = await Promise.all([
    prisma.file.findMany({
      where: { projectId },
      orderBy: { path: "asc" },
    }),
    prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
  ]);

  return { project, files, history: historyDesc.reverse() };
}
