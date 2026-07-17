"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "ui/components/button";
import { Separator } from "ui/components/separator";
import { useWorkspaceStore } from "@/stores/workspace";
import { RuntimeStatus } from "@/components/preview/runtime-status";

export function Navbar() {
  const project = useWorkspaceStore((state) => state.project);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <Button asChild variant="ghost" size="icon" className="size-8">
        <Link href="/" aria-label="Back to dashboard">
          <ArrowLeft />
        </Link>
      </Button>
      <Separator orientation="vertical" className="!h-5" />
      <span className="truncate text-sm font-medium">
        {project?.name ?? "Loading..."}
      </span>
      <div className="ml-auto">
        <RuntimeStatus />
      </div>
    </header>
  );
}
