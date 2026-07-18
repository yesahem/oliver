import { getBootedContainer } from "./boot";

// Writes a single changed file into the container. The full tree is never
// re-mounted after the initial load.
export async function syncFileToContainer(
  path: string,
  content: string,
): Promise<void> {
  const container = getBootedContainer();
  if (!container) return;

  const parentDir = path.split("/").slice(0, -1).join("/");
  if (parentDir) {
    await container.fs.mkdir(parentDir, { recursive: true });
  }
  await container.fs.writeFile(path, content);
}

// Removes a file (or folder) deleted by AI operations.
export async function removeFileFromContainer(path: string): Promise<void> {
  const container = getBootedContainer();
  if (!container) return;
  await container.fs.rm(path, { recursive: true, force: true });
}
