"use client";

import { cn } from "ui/lib/utils";
import { useRuntimeStore } from "@/stores/runtime";
import type { RuntimeStatus } from "@/stores/runtime";

const INDICATOR: Record<
  RuntimeStatus,
  { label: string; dotClass: string; pulse: boolean }
> = {
  idle: { label: "Idle", dotClass: "bg-muted-foreground", pulse: false },
  booting: { label: "Booting", dotClass: "bg-yellow-500", pulse: true },
  installing: { label: "Installing", dotClass: "bg-yellow-500", pulse: true },
  starting: { label: "Starting", dotClass: "bg-yellow-500", pulse: true },
  ready: { label: "Running", dotClass: "bg-green-500", pulse: false },
  error: { label: "Failed", dotClass: "bg-red-500", pulse: false },
};

export function RuntimeStatus() {
  const status = useRuntimeStore((state) => state.status);
  const { label, dotClass, pulse } = INDICATOR[status];

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-2 rounded-full",
          dotClass,
          pulse && "animate-pulse",
        )}
      />
      {label}
    </span>
  );
}
