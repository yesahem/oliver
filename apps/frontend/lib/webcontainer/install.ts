import type { WebContainer } from "@webcontainer/api";

// Inside the container only npm exists — Bun is not available
// (foundations correction #1).
export async function installDependencies(
  container: WebContainer,
  onLog: (chunk: string) => void,
): Promise<void> {
  const process = await container.spawn("npm", ["install"]);
  void process.output
    .pipeTo(new WritableStream<string>({ write: onLog }))
    .catch(() => {});

  const exitCode = await process.exit;
  if (exitCode !== 0) {
    throw new Error(`npm install exited with code ${exitCode}`);
  }
}
