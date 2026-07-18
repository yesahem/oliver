export type OperationType = "CREATE" | "UPDATE" | "DELETE";

export interface FileOperation {
  type: OperationType;
  path: string;
  content?: string;
}

function normalizePath(raw: string): string | null {
  const path = raw.trim().replace(/^\.?\//, "");
  if (!path || path.includes("..") || path.endsWith("/")) return null;
  return path;
}

// Parses the machine-readable response format demanded by the system prompt:
// blocks separated by lines of ===, each block is OP / path / --- / contents.
// Unrecognized blocks are ignored; an empty result means the response was
// invalid and callers must not touch any files.
export function parseFileOperations(raw: string): FileOperation[] {
  const operations: FileOperation[] = [];

  for (const block of raw.split(/^===[ \t]*$/m)) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const op = lines[0]?.trim().toUpperCase();
    if (op !== "CREATE" && op !== "UPDATE" && op !== "DELETE") continue;

    const path = lines[1] ? normalizePath(lines[1]) : null;
    if (!path) continue;

    if (op === "DELETE") {
      operations.push({ type: op, path });
      continue;
    }

    const rest = lines.slice(2);
    const separator = rest.findIndex((line) => line.trim() === "---");
    if (separator === -1) continue;

    operations.push({
      type: op,
      path,
      content: rest.slice(separator + 1).join("\n"),
    });
  }

  return operations;
}
