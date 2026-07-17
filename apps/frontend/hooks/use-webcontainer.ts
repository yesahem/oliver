"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useRuntimeStore } from "@/stores/runtime";
import type { RuntimeStage } from "@/stores/runtime";
import {
  bootWebContainer,
  getBootedContainer,
  teardownWebContainer,
} from "@/lib/webcontainer/boot";
import { buildFileSystemTree } from "@/lib/webcontainer/mount";
import { installDependencies } from "@/lib/webcontainer/install";
import { startDevServer } from "@/lib/webcontainer/run";
import { waitForPreviewUrl } from "@/lib/webcontainer/preview";
import { syncFileToContainer } from "@/lib/webcontainer/sync";

function failingStage(): RuntimeStage {
  const status = useRuntimeStore.getState().status;
  if (status === "installing") return "install";
  if (status === "starting") return "server";
  return "boot";
}

async function runLifecycle(reboot: boolean): Promise<void> {
  const runtime = useRuntimeStore.getState();
  const { project, fileTree } = useWorkspaceStore.getState();
  if (!project || fileTree.length === 0) return;

  runtime.reset();
  try {
    if (reboot) await teardownWebContainer();

    runtime.setStatus("booting");
    runtime.appendLog("Booting WebContainer...");
    const container = await bootWebContainer();

    runtime.appendLog("Mounting project files...");
    await container.mount(buildFileSystemTree(fileTree));

    runtime.setStatus("installing");
    await installDependencies(container, runtime.appendLog);

    runtime.setStatus("starting");
    const server = await startDevServer(container, runtime.appendLog);
    const url = await Promise.race([
      waitForPreviewUrl(container),
      server.exit.then((code) => {
        throw new Error(`Development server exited with code ${code}`);
      }),
    ]);

    runtime.setPreviewUrl(url);
    runtime.setStatus("ready");

    // Edits made before the runtime was ready were never synced — flush them.
    const { openedFiles } = useWorkspaceStore.getState();
    for (const opened of Object.values(openedFiles)) {
      if (opened.dirty) {
        await syncFileToContainer(opened.file.path, opened.content);
      }
    }

    // If the dev server dies later, the iframe goes stale.
    void server.exit.then(() => {
      const state = useRuntimeStore.getState();
      if (state.status === "ready") {
        state.fail("preview", "Development server stopped unexpectedly");
      }
    });
  } catch (error) {
    runtime.fail(
      failingStage(),
      error instanceof Error ? error.message : "Unknown runtime error",
    );
  }
}

export function useWebContainer() {
  const projectId = useWorkspaceStore((state) => state.project?.id ?? null);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId || startedFor.current === projectId) return;
    const switchingProjects = startedFor.current !== null;
    startedFor.current = projectId;
    void runLifecycle(switchingProjects);
  }, [projectId]);

  const retry = useCallback(() => {
    void runLifecycle(true);
  }, []);

  const syncFile = useCallback((path: string, content: string) => {
    if (!getBootedContainer()) return;
    void syncFileToContainer(path, content).catch(() => {});
  }, []);

  return { retry, syncFile };
}
