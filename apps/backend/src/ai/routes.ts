import { Router } from "express";
import { z } from "zod";
import { prisma } from "db";
import { buildProjectContext } from "./context";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { generateCode } from "./generator";
import { parseFileOperations } from "./parser";
import { applyFileOperations } from "./file-writer";
import type { AppliedOperation } from "./file-writer";
import { GENERATION_ERROR_MESSAGES, GenerationError } from "./errors";

export const aiRouter = Router();

const generateSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().trim().min(1, "prompt is required").max(10_000),
});

// Spec: only one active generation per project.
const activeGenerations = new Set<string>();

function summarize(operations: AppliedOperation[]): string {
  const counts: Record<AppliedOperation["type"], number> = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
  };
  for (const op of operations) counts[op.type]++;

  const parts: string[] = [];
  if (counts.CREATE > 0) parts.push(`created ${counts.CREATE}`);
  if (counts.UPDATE > 0) parts.push(`updated ${counts.UPDATE}`);
  if (counts.DELETE > 0) parts.push(`deleted ${counts.DELETE}`);
  if (parts.length === 0) return "Done.";
  const noun = operations.length === 1 ? "file" : "files";
  return `Done — ${parts.join(", ")} ${noun}.`;
}

aiRouter.post("/generate", async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Invalid request body" });
    return;
  }
  const { projectId, prompt } = parsed.data;

  if (activeGenerations.has(projectId)) {
    res.status(409).json({
      success: false,
      error: "A generation is already running for this project.",
    });
    return;
  }

  activeGenerations.add(projectId);
  try {
    const context = await buildProjectContext(projectId);
    if (!context) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    await prisma.chatMessage.create({
      data: { projectId, role: "user", content: prompt },
    });

    const raw = await generateCode(SYSTEM_PROMPT, buildUserMessage(context, prompt));

    const operations = parseFileOperations(raw);
    if (operations.length === 0) {
      throw new GenerationError(
        "invalid_response",
        "Response contained no file operations",
      );
    }

    const { operations: applied, createdFolders } = await applyFileOperations(
      projectId,
      operations,
    );

    const summary = summarize(applied);
    await prisma.chatMessage.create({
      data: { projectId, role: "assistant", content: summary },
    });

    res.json({ success: true, operations: applied, createdFolders, summary });
  } catch (error) {
    if (error instanceof GenerationError) {
      const status =
        error.kind === "timeout" ? 504 : error.kind === "write" ? 500 : 502;
      res.status(status).json({
        success: false,
        error: GENERATION_ERROR_MESSAGES[error.kind],
        kind: error.kind,
      });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ success: false, error: "Unable to generate code." });
    }
  } finally {
    activeGenerations.delete(projectId);
  }
});
