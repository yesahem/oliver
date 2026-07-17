# Plan 006 — Streaming AI Generation

> Implements: `specs/006-specs.md`
> Prerequisites: Plans 003–005 (generation pipeline)
> Shared decisions: see `plans/000-foundations.md`

## Objective

Replace the single blocking `/ai/generate` response with a stream of progress events rendered as a live timeline in the chat, so the user always sees motion. Real events where the pipeline has them; timed filler steps where it doesn't (explicitly allowed for MVP).

---

## Step 1 — Event protocol

Shared type (backend `src/ai/stream/events.ts`, mirrored in frontend `lib/types.ts`):

```ts
interface GenerationEvent {
  type: "START" | "STEP" | "STEP_DONE" | "COMPLETE" | "ERROR";
  message: string;      // e.g. "Generating code..."
  stepId?: string;      // stable id so the UI can mark a step done
  timestamp: number;
  operations?: AppliedOperation[]; // only on COMPLETE — reuses Plan 004 payload
}
```

(`STEP_DONE` is a small addition over the spec's four types so the timeline can flip ● → ✓ without heuristics.)

## Step 2 — Transport: SSE over the POST response

Keep `POST /ai/generate`, but respond with `Content-Type: text/event-stream` and write events as they happen (`data: {json}\n\n`). The frontend reads it with `fetch` + `ReadableStream` parsing — no `EventSource` needed, so the POST body stays. Fallback niceties: heartbeat comment every 15 s, flush after every event, close on COMPLETE/ERROR.

```
src/ai/stream/
  events.ts     # types + event constructors
  publisher.ts  # per-request emitter handed through the pipeline (emit(event) -> res.write)
  sse.ts        # express helpers: set headers, serialize, heartbeat, safe close
```

## Step 3 — Instrument the pipeline (real events)

`generator.ts` emits at each real stage:

| Stage | Event message |
|---|---|
| request accepted | START "Thinking..." |
| context built (Plan 005) | STEP "Reading project files..." |
| Claude request sent | STEP "Generating code..." |
| Claude response received / parsing | STEP "Writing files..." |
| diff applied (Plan 004) | STEP_DONE + COMPLETE with operations |
| any failure | ERROR with the user-facing message from Plan 003's table |

Filler: between "Thinking..." and the first real event, the publisher may emit 1–2 timed steps ("Understanding your request...") — time-based is acceptable per spec; keep the filler list in one constant so wording can evolve.

Post-COMPLETE stages that happen client-side (WebContainer sync, install, dev server — Plan 002 states) are appended to the same timeline by the frontend from runtime status, so the user sees one continuous flow: "Installing dependencies..." → "Starting preview..." → "Preview Ready 🚀".

## Step 4 — Frontend streaming UI

```
hooks/use-generation-stream.ts        # POST + stream parse -> ordered step list, status
components/chat/generation-status.tsx # timeline container rendered inside the live assistant message
components/chat/progress-step.tsx     # ○ pending / ● in-progress / ✓ done / ✕ failed  (lucide icons)
```

- `use-ai.ts` (Plan 003) is rewritten on top of `use-generation-stream`; on COMPLETE it applies operations via `lib/apply-operations.ts` (Plan 004) exactly as before.
- The latest assistant chat message renders `generation-status` while streaming; on completion it collapses to the final summary + "Preview Ready 🚀"; chat auto-scrolls to the newest message.
- First visual update within 500 ms (START is emitted before any work happens).
- ERROR renders "Generation Failed — <reason>" + Retry; never an infinite spinner (a client-side stall timeout of ~150 s aborts and shows the failure state).
- Input stays disabled during streaming; the rest of the UI stays interactive.

---

## Acceptance checklist (from spec)

- [ ] Progress starts immediately after submit (<500 ms to first event)
- [ ] Timeline shows progressive ○/●/✓/✕ steps, no static spinner anywhere
- [ ] Real pipeline stages emit real events; filler steps cover the gaps
- [ ] COMPLETE applies file operations and hands off to preview status steps
- [ ] Failures show a meaningful message + Retry
- [ ] Chat remains responsive and auto-scrolls

## Out of scope (per spec)

Token-by-token streaming of code, multi-agent timelines, progress percentages, cost tracking, cancellation (future).
