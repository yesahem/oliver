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
