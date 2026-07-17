"use client";

import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "ui/components/resizable";
import type { FileNode, Project } from "@/lib/types";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWebContainer } from "@/hooks/use-webcontainer";
import { Navbar } from "./navbar";
import { FileExplorer } from "@/components/sidebar/file-explorer";
import { EditorPanel } from "@/components/editor/editor-panel";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { ChatPanel } from "@/components/chat/chat-panel";

interface WorkspaceLayoutProps {
  project: Project;
  fileTree: FileNode[];
}

export function WorkspaceLayout({ project, fileTree }: WorkspaceLayoutProps) {
  const initialize = useWorkspaceStore((state) => state.initialize);
  const { retry, syncFile } = useWebContainer();

  // Hydrate the store before children first render, then again on prop changes.
  useState(() => initialize(project, fileTree));
  useEffect(() => {
    initialize(project, fileTree);
  }, [initialize, project, fileTree]);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <Navbar />
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="16%" minSize="10%">
          <FileExplorer />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="38%" minSize="20%">
          <EditorPanel syncFile={syncFile} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="26%" minSize="12%">
          <PreviewPanel onRetry={retry} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="20%" minSize="14%">
          <ChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
