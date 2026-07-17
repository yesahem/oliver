"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileCode2, Loader2, Save, X } from "lucide-react";
import { Button } from "ui/components/button";
import { cn } from "ui/lib/utils";
import { api } from "@/lib/api";
import { languageFromPath } from "@/lib/language";
import { useWorkspaceStore } from "@/stores/workspace";
import { Monaco } from "./monaco";

interface EditorPanelProps {
  syncFile: (path: string, content: string) => void;
}

export function EditorPanel({ syncFile }: EditorPanelProps) {
  const selectedFileId = useWorkspaceStore((state) => state.selectedFileId);
  const openedFiles = useWorkspaceStore((state) => state.openedFiles);
  const tabOrder = useWorkspaceStore((state) => state.tabOrder);
  const selectFile = useWorkspaceStore((state) => state.selectFile);
  const closeFile = useWorkspaceStore((state) => state.closeFile);
  const updateContent = useWorkspaceStore((state) => state.updateContent);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selected = selectedFileId ? openedFiles[selectedFileId] : undefined;

  // Debounce container syncs per path so rapid edits across files each land.
  const syncTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = syncTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const queueSync = useCallback(
    (path: string, content: string) => {
      const timers = syncTimers.current;
      const pending = timers.get(path);
      if (pending) clearTimeout(pending);
      timers.set(
        path,
        setTimeout(() => {
          timers.delete(path);
          syncFile(path, content);
        }, 300),
      );
    },
    [syncFile],
  );

  const save = useCallback(async () => {
    const state = useWorkspaceStore.getState();
    const fileId = state.selectedFileId;
    const project = state.project;
    if (!fileId || !project) return;
    const opened = state.openedFiles[fileId];
    if (!opened?.dirty) return;

    setSaving(true);
    setSaveError(null);
    try {
      await api.saveFile(project.id, fileId, opened.content);
      state.markSaved(fileId);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b">
        <div className="flex min-w-0 flex-1 items-center self-stretch overflow-x-auto">
          {tabOrder.map((fileId) => {
            const opened = openedFiles[fileId];
            if (!opened) return null;
            const active = fileId === selectedFileId;
            return (
              <div
                key={fileId}
                className={cn(
                  "group flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-r px-3 text-sm",
                  active
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
                onClick={() => selectFile(fileId)}
              >
                <span className="max-w-40 truncate">{opened.file.name}</span>
                {opened.dirty && (
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-foreground/70"
                    aria-label="Unsaved changes"
                  />
                )}
                <button
                  type="button"
                  aria-label={`Close ${opened.file.name}`}
                  className="rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeFile(fileId);
                  }}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        {saveError && (
          <span className="max-w-48 truncate px-2 text-xs text-destructive">
            {saveError}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mx-1 h-7 shrink-0"
          disabled={!selected?.dirty || saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Save
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        {selected ? (
          <Monaco
            path={selected.file.path}
            language={languageFromPath(selected.file.path)}
            value={selected.content}
            onChange={(value) => {
              updateContent(selected.file.id, value);
              queueSync(selected.file.path, value);
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileCode2 className="size-10" />
            <p className="text-sm">Select a file to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}
