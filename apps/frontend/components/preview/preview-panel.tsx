"use client";

import { Loader2, MonitorPlay, TriangleAlert } from "lucide-react";
import { Button } from "ui/components/button";
import { useRuntimeStore } from "@/stores/runtime";
import type { RuntimeStage, RuntimeStatus } from "@/stores/runtime";
import { ConsolePanel } from "./console-panel";

const LOADING_MESSAGES: Record<Exclude<RuntimeStatus, "ready" | "error">, string> = {
  idle: "Starting Runtime...",
  booting: "Starting Runtime...",
  installing: "Installing Dependencies...",
  starting: "Starting Development Server...",
};

const ERROR_MESSAGES: Record<RuntimeStage, string> = {
  boot: "Unable to start runtime.",
  install: "Dependency installation failed.",
  server: "Unable to start development server.",
  preview: "Preview unavailable.",
};

function LoadingState({ status }: { status: Exclude<RuntimeStatus, "ready" | "error"> }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{LOADING_MESSAGES[status]}</p>
    </div>
  );
}

function ErrorState({
  stage,
  message,
  onRetry,
}: {
  stage: RuntimeStage;
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <TriangleAlert className="size-8 text-destructive" />
      <p className="text-sm font-medium">{ERROR_MESSAGES[stage]}</p>
      {message && (
        <p className="max-w-full truncate text-xs text-muted-foreground">
          {message}
        </p>
      )}
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function PreviewPanel({ onRetry }: { onRetry: () => void }) {
  const status = useRuntimeStore((state) => state.status);
  const previewUrl = useRuntimeStore((state) => state.previewUrl);
  const failedStage = useRuntimeStore((state) => state.failedStage);
  const error = useRuntimeStore((state) => state.error);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Preview
      </div>

      <div className="min-h-0 flex-1">
        {status === "ready" && previewUrl ? (
          <iframe
            src={previewUrl}
            title="App preview"
            allow="cross-origin-isolated"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            className="h-full w-full border-0 bg-white"
          />
        ) : status === "error" ? (
          <ErrorState
            stage={failedStage ?? "boot"}
            message={error}
            onRetry={onRetry}
          />
        ) : status === "ready" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <MonitorPlay className="size-10" />
            <p className="text-sm">Preview unavailable.</p>
          </div>
        ) : (
          <LoadingState status={status} />
        )}
      </div>

      <ConsolePanel />
    </div>
  );
}
