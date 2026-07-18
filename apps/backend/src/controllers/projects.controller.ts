import type { Request, Response } from "express";
import { z } from "zod";
import {
  createProject,
  getProjectWithTree,
  listMessages,
  listProjects,
  updateFileContent,
} from "../services/projects.service";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100),
});

const updateFileSchema = z.object({
  content: z.string(),
});

export async function handleCreateProject(req: Request, res: Response) {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    return;
  }

  const project = await createProject(parsed.data.name);
  res.status(201).json({ id: project.id, name: project.name });
}

export async function handleListProjects(_req: Request, res: Response) {
  res.json(await listProjects());
}

export async function handleGetProject(
  req: Request<{ id: string }>,
  res: Response,
) {
  const result = await getProjectWithTree(req.params.id);
  if (!result) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(result);
}

export async function handleListMessages(
  req: Request<{ id: string }>,
  res: Response,
) {
  const messages = await listMessages(req.params.id);
  if (!messages) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(messages);
}

export async function handleUpdateFile(
  req: Request<{ id: string; fileId: string }>,
  res: Response,
) {
  const parsed = updateFileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "content must be a string" });
    return;
  }

  const file = await updateFileContent(
    req.params.id,
    req.params.fileId,
    parsed.data.content,
  );
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json({ id: file.id, path: file.path, updatedAt: file.updatedAt });
}
