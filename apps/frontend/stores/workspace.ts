import { create } from "zustand";
import type { AppliedFileOperation, FileNode, Project } from "@/lib/types";

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
  applyOperations: (
    operations: AppliedFileOperation[],
    createdFolders: { id: string; path: string }[],
  ) => void;
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

  applyOperations: (operations, createdFolders) => {
    set((state) => {
      const fileTree = structuredClone(state.fileTree);
      const folderIdByPath = new Map(
        createdFolders.map((folder) => [folder.path, folder.id]),
      );
      const openedFiles = { ...state.openedFiles };
      let tabOrder = state.tabOrder;
      let selectedFileId = state.selectedFileId;
      let openedChanged = false;

      const findNode = (
        nodes: FileNode[],
        path: string,
      ): FileNode | undefined => {
        for (const node of nodes) {
          if (node.path === path) return node;
          const found = node.children && findNode(node.children, path);
          if (found) return found;
        }
        return undefined;
      };

      // Returns the children array that should hold a file at `path`,
      // creating missing folder nodes along the way.
      const ensureFolders = (path: string): FileNode[] => {
        const parts = path.split("/").slice(0, -1);
        let current = fileTree;
        let prefix = "";
        for (const part of parts) {
          prefix = prefix ? `${prefix}/${part}` : part;
          let folder = current.find((n) => n.isFolder && n.path === prefix);
          if (!folder) {
            folder = {
              id: folderIdByPath.get(prefix) ?? crypto.randomUUID(),
              name: part,
              path: prefix,
              isFolder: true,
              content: "",
              children: [],
            };
            current.push(folder);
          }
          current = folder.children!;
        }
        return current;
      };

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

      for (const op of operations) {
        if (op.type === "DELETE") {
          const removeFrom = (nodes: FileNode[]): boolean => {
            const index = nodes.findIndex((n) => n.path === op.path);
            if (index >= 0) {
              nodes.splice(index, 1);
              return true;
            }
            return nodes.some(
              (n) => n.children !== undefined && removeFrom(n.children),
            );
          };
          removeFrom(fileTree);

          // Close tabs for the deleted file (or anything under a deleted folder).
          for (const [id, opened] of Object.entries(openedFiles)) {
            if (
              opened.file.path === op.path ||
              opened.file.path.startsWith(`${op.path}/`)
            ) {
              delete openedFiles[id];
              openedChanged = true;
            }
          }
          if (openedChanged) {
            tabOrder = tabOrder.filter((id) => openedFiles[id]);
            if (selectedFileId && !openedFiles[selectedFileId]) {
              selectedFileId = tabOrder.at(-1) ?? null;
            }
          }
          continue;
        }

        const content = op.content ?? "";
        const existing = findNode(fileTree, op.path);
        if (existing && !existing.isFolder) {
          existing.content = content;
        } else if (!existing) {
          ensureFolders(op.path).push({
            id: op.id ?? crypto.randomUUID(),
            name: op.path.split("/").at(-1)!,
            path: op.path,
            isFolder: false,
            content,
          });
        }

        // Refresh the editor if the file is currently open.
        for (const [id, opened] of Object.entries(openedFiles)) {
          if (opened.file.path === op.path) {
            openedFiles[id] = {
              ...opened,
              content,
              dirty: false,
              file: { ...opened.file, content },
            };
            openedChanged = true;
          }
        }
      }

      sortNodes(fileTree);

      return {
        fileTree,
        openedFiles: openedChanged ? openedFiles : state.openedFiles,
        tabOrder,
        selectedFileId,
      };
    });
  },
}));
