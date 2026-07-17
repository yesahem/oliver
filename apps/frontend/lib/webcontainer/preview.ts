import type { WebContainer } from "@webcontainer/api";

const SERVER_READY_TIMEOUT_MS = 60_000;

export function waitForPreviewUrl(container: WebContainer): Promise<string> {
  return new Promise((resolve, reject) => {
    const unsubscribe = container.on("server-ready", (_port, url) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(url);
    });
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("Timed out waiting for the dev server"));
    }, SERVER_READY_TIMEOUT_MS);
  });
}
