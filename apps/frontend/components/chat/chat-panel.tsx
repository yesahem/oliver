"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, SendHorizontal } from "lucide-react";
import { Button } from "ui/components/button";
import { ScrollArea } from "ui/components/scroll-area";
import { Textarea } from "ui/components/textarea";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAi } from "@/hooks/use-ai";

const GENERATING_LABELS = [
  "Thinking...",
  "Generating code...",
  "Updating files...",
];

function GeneratingIndicator() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setLabelIndex((prev) => (prev + 1) % GENERATING_LABELS.length),
      2500,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mr-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      {GENERATING_LABELS[labelIndex]}
    </div>
  );
}

export function ChatPanel() {
  const projectId = useWorkspaceStore((state) => state.project?.id ?? null);
  const { status, error, generate } = useAi();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const generating = status === "generating";

  // Reset local chat state when the project changes (adjust-during-render).
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  if (projectId !== loadedProjectId) {
    setLoadedProjectId(projectId);
    setMessages([]);
    setLastPrompt(null);
  }

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    api
      .getMessages(projectId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    const viewport = scrollWrapperRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    viewport?.scrollTo({ top: viewport.scrollHeight });
  }, [messages, generating]);

  async function send(prompt: string) {
    const text = prompt.trim();
    if (!text || generating) return;

    setLastPrompt(text);
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text, createdAt: "" },
    ]);

    const summary = await generate(text);
    if (summary) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: summary,
          createdAt: "",
        },
      ]);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Chat
      </div>

      {messages.length === 0 && !generating ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
          <MessageSquare className="size-10" />
          <p className="text-sm">Ask AI to build something...</p>
        </div>
      ) : (
        <div ref={scrollWrapperRef} className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-3">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div
                    key={message.id}
                    className="ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground"
                  >
                    {message.content}
                  </div>
                ) : (
                  <div
                    key={message.id}
                    className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
                  >
                    {message.content}
                  </div>
                ),
              )}

              {generating && <GeneratingIndicator />}

              {status === "error" && (
                <div className="mr-auto flex max-w-[85%] flex-col gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
                  <span>{error ?? "Generation failed."}</span>
                  {lastPrompt && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start"
                      onClick={() => void send(lastPrompt)}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <form
        className="flex shrink-0 items-end gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(draft);
            }
          }}
          placeholder="Ask Oliver to build something..."
          className="max-h-32 min-h-9 resize-none"
          rows={1}
          disabled={generating}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim() || generating}
        >
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
