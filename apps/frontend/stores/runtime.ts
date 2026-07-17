import { create } from "zustand";

export type RuntimeStatus =
  | "idle"
  | "booting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

export type RuntimeStage = "boot" | "install" | "server" | "preview";

const MAX_LOG_LINES = 500;

interface RuntimeState {
  status: RuntimeStatus;
  failedStage: RuntimeStage | null;
  previewUrl: string | null;
  logs: string[];
  error: string | null;

  setStatus: (status: RuntimeStatus) => void;
  setPreviewUrl: (url: string) => void;
  appendLog: (chunk: string) => void;
  fail: (stage: RuntimeStage, message: string) => void;
  reset: () => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  status: "idle",
  failedStage: null,
  previewUrl: null,
  logs: [],
  error: null,

  setStatus: (status) => set({ status }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  appendLog: (chunk) =>
    set((state) => {
      const lines = chunk.split(/\r?\n/).filter((line) => line.length > 0);
      if (lines.length === 0) return state;
      return { logs: [...state.logs, ...lines].slice(-MAX_LOG_LINES) };
    }),

  fail: (stage, message) =>
    set({ status: "error", failedStage: stage, error: message }),

  reset: () =>
    set({
      status: "idle",
      failedStage: null,
      previewUrl: null,
      logs: [],
      error: null,
    }),
}));
