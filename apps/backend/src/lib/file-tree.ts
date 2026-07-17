import type { File } from "db";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  content: string;
  children?: FileNode[];
}

/**
 * Assembles flat File rows into a nested tree using parentId.
 * Children are sorted folders-first, then alphabetically by name.
 */
export function buildFileTree(files: File[]): FileNode[] {
  const nodes = new Map<string, FileNode>();
  for (const file of files) {
    nodes.set(file.id, {
      id: file.id,
      name: file.name,
      path: file.path,
      isFolder: file.isFolder,
      content: file.isFolder ? "" : file.content,
      ...(file.isFolder ? { children: [] } : {}),
    });
  }

  const roots: FileNode[] = [];
  for (const file of files) {
    const node = nodes.get(file.id)!;
    const parent = file.parentId ? nodes.get(file.parentId) : undefined;
    if (parent?.children) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: FileNode[]) => {
    list.sort((a, b) =>
      a.isFolder === b.isFolder
        ? a.name.localeCompare(b.name)
        : a.isFolder
          ? -1
          : 1,
    );
    for (const node of list) {
      if (node.children) sortNodes(node.children);
    }
  };
  sortNodes(roots);

  return roots;
}
