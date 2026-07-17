import { prisma, type File, type Project } from "db";
import { TEMPLATE_FILES } from "./template";
import { buildFileTree, type FileNode } from "../lib/file-tree";

export async function createProject(name: string): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({ data: { name } });

    // Folder rows for every directory in the template, parents before children
    // (lexicographic sort puts "src" before "src/anything").
    const folderPaths = new Set<string>();
    for (const { path } of TEMPLATE_FILES) {
      const parts = path.split("/");
      for (let depth = 1; depth < parts.length; depth++) {
        folderPaths.add(parts.slice(0, depth).join("/"));
      }
    }

    const folderIds = new Map<string, string>();
    for (const folderPath of [...folderPaths].sort()) {
      const parts = folderPath.split("/");
      const folder = await tx.file.create({
        data: {
          projectId: project.id,
          name: parts.at(-1)!,
          path: folderPath,
          isFolder: true,
          parentId: folderIds.get(parts.slice(0, -1).join("/")) ?? null,
        },
      });
      folderIds.set(folderPath, folder.id);
    }

    for (const { path, content } of TEMPLATE_FILES) {
      const parts = path.split("/");
      await tx.file.create({
        data: {
          projectId: project.id,
          name: parts.at(-1)!,
          path,
          content,
          parentId: folderIds.get(parts.slice(0, -1).join("/")) ?? null,
        },
      });
    }

    return project;
  });
}

export async function listProjects(): Promise<Project[]> {
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getProjectWithTree(
  id: string,
): Promise<{ project: Project; fileTree: FileNode[] } | null> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;

  const files = await prisma.file.findMany({ where: { projectId: id } });
  return { project, fileTree: buildFileTree(files) };
}

export async function updateFileContent(
  projectId: string,
  fileId: string,
  content: string,
): Promise<File | null> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId, isFolder: false },
  });
  if (!file) return null;

  return prisma.file.update({ where: { id: fileId }, data: { content } });
}
