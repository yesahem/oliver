export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  content: string;
  children?: FileNode[];
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export type FileOperationType = "CREATE" | "UPDATE" | "DELETE";

export interface AppliedFileOperation {
  type: FileOperationType;
  path: string;
  content?: string;
  id?: string;
}

export interface GenerateResponse {
  success: true;
  operations: AppliedFileOperation[];
  createdFolders: { id: string; path: string }[];
  summary: string;
}
