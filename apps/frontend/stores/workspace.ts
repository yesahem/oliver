import { create } from "zustand";
import type { FileNode, Project } from "@/lib/types";

export interface OpenedFile {
  file: FileNode;
  content: string;
  dirty: boolean;
}

interface WorkspaceState {
  project: Project | null;
  fileTree: FileNode[];
  selectedFileId: string | null;
  openedFiles: Record<string, OpenedFile>;
  tabOrder: string[];

  initialize: (project: Project, fileTree: FileNode[]) => void;
  openFile: (file: FileNode) => void;
  closeFile: (id: string) => void;
  selectFile: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  project: null,
  fileTree: [],
  selectedFileId: null,
  openedFiles: {},
  tabOrder: [],

  initialize: (project, fileTree) => {
    // Keep open tabs when the same project re-hydrates (e.g. fast refresh);
    // reset everything when switching to a different project.
    if (get().project?.id === project.id) {
      set({ project, fileTree });
    } else {
      set({
        project,
        fileTree,
        selectedFileId: null,
        openedFiles: {},
        tabOrder: [],
      });
    }
  },

  openFile: (file) => {
    if (file.isFolder) return;
    const { openedFiles, tabOrder } = get();
    if (openedFiles[file.id]) {
      set({ selectedFileId: file.id });
      return;
    }
    set({
      openedFiles: {
        ...openedFiles,
        [file.id]: { file, content: file.content, dirty: false },
      },
      tabOrder: [...tabOrder, file.id],
      selectedFileId: file.id,
    });
  },

  closeFile: (id) => {
    const { openedFiles, tabOrder, selectedFileId } = get();
    const rest = { ...openedFiles };
    delete rest[id];
    const nextOrder = tabOrder.filter((tabId) => tabId !== id);

    let nextSelected = selectedFileId;
    if (selectedFileId === id) {
      const closedIndex = tabOrder.indexOf(id);
      nextSelected =
        nextOrder[Math.min(closedIndex, nextOrder.length - 1)] ?? null;
    }

    set({
      openedFiles: rest,
      tabOrder: nextOrder,
      selectedFileId: nextSelected,
    });
  },

  selectFile: (id) => {
    if (get().openedFiles[id]) set({ selectedFileId: id });
  },

  updateContent: (id, content) => {
    const opened = get().openedFiles[id];
    if (!opened) return;
    set({
      openedFiles: {
        ...get().openedFiles,
        [id]: { ...opened, content, dirty: content !== opened.file.content },
      },
    });
  },

  markSaved: (id) => {
    const opened = get().openedFiles[id];
    if (!opened) return;
    set({
      openedFiles: {
        ...get().openedFiles,
        [id]: {
          ...opened,
          dirty: false,
          file: { ...opened.file, content: opened.content },
        },
      },
    });
  },
}));
