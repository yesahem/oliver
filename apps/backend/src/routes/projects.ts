import { Router } from "express";
import {
  handleCreateProject,
  handleGetProject,
  handleListMessages,
  handleListProjects,
  handleUpdateFile,
} from "../controllers/projects.controller";

export const projectsRouter = Router();

projectsRouter.post("/", handleCreateProject);
projectsRouter.get("/", handleListProjects);
projectsRouter.get("/:id", handleGetProject);
projectsRouter.get("/:id/messages", handleListMessages);
projectsRouter.put("/:id/files/:fileId", handleUpdateFile);
