import { prisma, type File } from "db";
import type { FileOperation, OperationType } from "./parser";
import { GenerationError } from "./errors";

export interface AppliedOperation {
  type: OperationType;
  path: string;
  content?: string;
  id?: string;
}

export interface ApplyResult {
  operations: AppliedOperation[];
  createdFolders: { id: string; path: string }[];
}

// Applies operations to the DB in a single transaction — a failure anywhere
// rolls everything back. Plan 004 extracts and hardens this into the diff
// engine; for now UPDATE-of-a-missing-file falls back to CREATE because LLMs
// confuse the two.
export async function applyFileOperations(
  projectId: string,
  operations: FileOperation[],
): Promise<ApplyResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const applied: AppliedOperation[] = [];
      const createdFolders: { id: string; path: string }[] = [];

      const folderIds = new Map<string, string>();
      const existingFolders = await tx.file.findMany({
        where: { projectId, isFolder: true },
        select: { id: true, path: true },
      });
      for (const folder of existingFolders) {
        folderIds.set(folder.path, folder.id);
      }

      // Creates any missing ancestor folder rows, returning the parentId for
      // the file at `path` (null for root-level files).
      async function ensureFolders(path: string): Promise<string | null> {
        const parts = path.split("/");
        let parentId: string | null = null;
        for (let depth = 1; depth < parts.length; depth++) {
          const folderPath = parts.slice(0, depth).join("/");
          const existingId = folderIds.get(folderPath);
          if (existingId) {
            parentId = existingId;
            continue;
          }
          const folder: File = await tx.file.create({
            data: {
              projectId,
              name: parts[depth - 1]!,
              path: folderPath,
              isFolder: true,
              parentId,
            },
          });
          folderIds.set(folderPath, folder.id);
          createdFolders.push({ id: folder.id, path: folderPath });
          parentId = folder.id;
        }
        return parentId;
      }

      for (const op of operations) {
        if (op.type === "DELETE") {
          const target = await tx.file.findUnique({
            where: { projectId_path: { projectId, path: op.path } },
          });
          if (target) {
            if (target.isFolder) {
              await tx.file.deleteMany({
                where: { projectId, path: { startsWith: `${op.path}/` } },
              });
              folderIds.delete(op.path);
            }
            await tx.file.delete({ where: { id: target.id } });
          }
          applied.push({ type: "DELETE", path: op.path });
          continue;
        }

        const content = op.content ?? "";
        const existing = await tx.file.findUnique({
          where: { projectId_path: { projectId, path: op.path } },
        });

        if (existing && !existing.isFolder) {
          await tx.file.update({ where: { id: existing.id }, data: { content } });
          applied.push({ type: "UPDATE", path: op.path, content, id: existing.id });
        } else if (!existing) {
          const parentId = await ensureFolders(op.path);
          const created = await tx.file.create({
            data: {
              projectId,
              name: op.path.split("/").at(-1)!,
              path: op.path,
              content,
              parentId,
            },
          });
          applied.push({ type: "CREATE", path: op.path, content, id: created.id });
        }
        // A folder already sitting at the file's path is pathological; skip it.
      }

      return { operations: applied, createdFolders };
    });
  } catch (error) {
    throw new GenerationError(
      "write",
      error instanceof Error ? error.message : "Database write failed",
    );
  }
}
