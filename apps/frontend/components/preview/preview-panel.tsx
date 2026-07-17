import { MonitorPlay } from "lucide-react";

export function PreviewPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Preview
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MonitorPlay className="size-10" />
        <p className="text-sm">Preview coming soon...</p>
      </div>
    </div>
  );
}
