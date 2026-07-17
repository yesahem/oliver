"use client";

import { useState } from "react";
import {
  ChevronRight,
  File as FileIcon,
  Folder,
  FolderOpen,
} from "lucide-react";
import { ScrollArea } from "ui/components/scroll-area";
import { cn } from "ui/lib/utils";
import type { FileNode } from "@/lib/types";
import { useWorkspaceStore } from "@/stores/workspace";

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const selectedFileId = useWorkspaceStore((state) => state.selectedFileId);
  const openFile = useWorkspaceStore((state) => state.openFile);

  const indent = { paddingLeft: `${depth * 12 + 8}px` };

  if (node.isFolder) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          style={indent}
          className="flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 transition-transform",
              expanded && "rotate-90",
            )}
          />
          {expanded ? (
            <FolderOpen className="size-4 shrink-0" />
          ) : (
            <Folder className="size-4 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openFile(node)}
      style={indent}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-sm hover:bg-accent hover:text-accent-foreground",
        selectedFileId === node.id
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
      )}
    >
      <span className="size-3.5 shrink-0" />
      <FileIcon className="size-4 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileExplorer() {
  const fileTree = useWorkspaceStore((state) => state.fileTree);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Explorer
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="py-1.5 pr-1">
          {fileTree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
