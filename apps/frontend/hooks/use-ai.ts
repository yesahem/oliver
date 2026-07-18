"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  removeFileFromContainer,
  syncFileToContainer,
} from "@/lib/webcontainer/sync";

export type AiStatus = "idle" | "generating" | "error";

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Generation timed out.";
  }
  if (error instanceof Error) return error.message;
  return "Unable to generate code.";
}

export function useAi() {
  const [status, setStatus] = useState<AiStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string): Promise<string | null> => {
    const projectId = useWorkspaceStore.getState().project?.id;
    if (!projectId) return null;

    setStatus("generating");
    setError(null);
    try {
      const result = await api.generate(projectId, prompt);

      useWorkspaceStore
        .getState()
        .applyOperations(result.operations, result.createdFolders);

      // Sync the changed files into the WebContainer; Vite HMR refreshes
      // the preview automatically.
      for (const op of result.operations) {
        if (op.type === "DELETE") {
          await removeFileFromContainer(op.path).catch(() => {});
        } else if (op.content !== undefined) {
          await syncFileToContainer(op.path, op.content).catch(() => {});
        }
      }

      setStatus("idle");
      return result.summary;
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
      return null;
    }
  }, []);

  return { status, error, generate };
}
