"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { ScrollArea } from "ui/components/scroll-area";
import { cn } from "ui/lib/utils";
import { useRuntimeStore } from "@/stores/runtime";

export function ConsolePanel() {
  const logs = useRuntimeStore((state) => state.logs);
  const status = useRuntimeStore((state) => state.status);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hasError = status === "error";
  const expanded = open || hasError;

  useEffect(() => {
    if (!expanded) return;
    const viewport = wrapperRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    viewport?.scrollTo({ top: viewport.scrollHeight });
  }, [logs, expanded]);

  return (
    <div className="shrink-0 border-t">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-7 w-full items-center gap-1.5 px-3 text-xs text-muted-foreground hover:bg-accent/50"
      >
        <Terminal className="size-3.5" />
        <span className="font-medium tracking-wide uppercase">Console</span>
        {expanded ? (
          <ChevronDown className="ml-auto size-3.5" />
        ) : (
          <ChevronUp className="ml-auto size-3.5" />
        )}
      </button>

      <div
        ref={wrapperRef}
        className={cn("overflow-hidden", expanded ? "h-40" : "h-0")}
      >
        <ScrollArea className="h-full">
          <pre className="px-3 py-2 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
            {logs.length > 0 ? logs.join("\n") : "No logs yet."}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}
