import { Router } from "express";
import {
  handleCreateProject,
  handleGetProject,
  handleListProjects,
  handleUpdateFile,
} from "../controllers/projects.controller";

export const projectsRouter = Router();

projectsRouter.post("/", handleCreateProject);
projectsRouter.get("/", handleListProjects);
projectsRouter.get("/:id", handleGetProject);
projectsRouter.put("/:id/files/:fileId", handleUpdateFile);
