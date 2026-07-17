import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

// Starts the Vite dev server. The process keeps running, so the returned
// process lets callers stream logs and watch for an early exit.
export async function startDevServer(
  container: WebContainer,
  onLog: (chunk: string) => void,
): Promise<WebContainerProcess> {
  const process = await container.spawn("npm", ["run", "dev"]);
  void process.output
    .pipeTo(new WritableStream<string>({ write: onLog }))
    .catch(() => {});
  return process;
}
