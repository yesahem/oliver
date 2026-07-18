import type {
  ChatMessage,
  FileNode,
  GenerateResponse,
  Project,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<Project[]>("/projects"),

  createProject: (name: string) =>
    request<{ id: string; name: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getProject: (id: string) =>
    request<{ project: Project; fileTree: FileNode[] }>(`/projects/${id}`),

  saveFile: (projectId: string, fileId: string, content: string) =>
    request<{ id: string; path: string; updatedAt: string }>(
      `/projects/${projectId}/files/${fileId}`,
      { method: "PUT", body: JSON.stringify({ content }) },
    ),

  getMessages: (projectId: string) =>
    request<ChatMessage[]>(`/projects/${projectId}/messages`),

  generate: (projectId: string, prompt: string) =>
    request<GenerateResponse>("/ai/generate", {
      method: "POST",
      body: JSON.stringify({ projectId, prompt }),
      // Slightly above the backend's 120s Claude timeout.
      signal: AbortSignal.timeout(130_000),
    }),
};
