import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { projectsRouter } from "./routes/projects";
import { aiRouter } from "./ai/routes";

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/projects", projectsRouter);
app.use("/ai", aiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
