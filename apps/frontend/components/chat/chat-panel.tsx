"use client";

import { useState } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { Button } from "ui/components/button";
import { ScrollArea } from "ui/components/scroll-area";
import { Textarea } from "ui/components/textarea";

interface ChatMessage {
  id: number;
  role: "user";
  text: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text }]);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Chat
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
          <MessageSquare className="size-10" />
          <p className="text-sm">
            Describe what you want to build. AI generation arrives in a later
            milestone.
          </p>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground"
              >
                {message.text}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <form
        className="flex shrink-0 items-end gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Ask Oliver to build something..."
          className="max-h-32 min-h-9 resize-none"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim()}
        >
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
