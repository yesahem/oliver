import type { FileSystemTree } from "@webcontainer/api";
import type { FileNode } from "@/lib/types";

export function buildFileSystemTree(nodes: FileNode[]): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const node of nodes) {
    if (node.isFolder) {
      tree[node.name] = { directory: buildFileSystemTree(node.children ?? []) };
    } else {
      tree[node.name] = { file: { contents: node.content } };
    }
  }
  return tree;
}
