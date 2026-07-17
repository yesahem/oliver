"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface MonacoProps {
  path: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
}

export function Monaco({ path, language, value, onChange }: MonacoProps) {
  return (
    <MonacoEditor
      theme="vs-dark"
      path={path}
      language={language}
      value={value}
      onChange={(next) => onChange(next ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        tabSize: 2,
      }}
    />
  );
}
