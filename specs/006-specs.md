# Spec 06 — Streaming AI Generation

> **Phase:** Day 5-6
> **Priority:** P0 (Core UX)
> **Estimated Time:** 1 Day
> **Status:** Not Started

---

# Goal

Build a streaming generation experience that makes the AI feel alive.

Users should never stare at a loading spinner while waiting for code generation.

Instead, the platform should continuously communicate what is happening during the generation process through progressive status updates.

Even if some of these updates are simulated during the MVP, the experience should feel responsive and transparent.

The objective is to improve **perceived performance**, not just actual performance.

---

# Why This Exists

❌ Bad

```text
Generating...

⏳

45 seconds...
```

The user has no idea if anything is happening.

---

✅ Good

```text
✓ Understanding request

✓ Reading project

✓ Creating components

✓ Writing code

✓ Installing packages

✓ Starting preview

Done 🚀
```

The user always feels progress.

---

# High Level Flow

```text
User Prompt

↓

Generation Started

↓

Stream Progress Updates

↓

Receive File Operations

↓

Apply Changes

↓

Sync WebContainer

↓

Preview Ready
```

---

# Responsibilities

## apps/frontend

Responsible for

- Displaying generation progress
- Streaming status updates
- Rendering progress timeline
- Showing completion state
- Showing failure state

---

## apps/backend

Responsible for

- Sending generation events
- Streaming AI responses
- Broadcasting progress updates
- Emitting completion events
- Emitting error events

---

# Generation States

The generation pipeline should expose a sequence of status updates.

Suggested MVP flow

```text
Thinking...

↓

Understanding your request...

↓

Reading project files...

↓

Generating code...

↓

Writing files...

↓

Installing dependencies...

↓

Starting development server...

↓

Launching preview...

↓

Done
```

Each step should appear progressively.

---

# Streaming Experience

The UI should receive events as they happen.

Example

```text
Thinking...

✓ Thinking...

Reading project...

✓ Reading project...

Generating code...

✓ Generating code...

Writing files...

✓ Writing files...

Installing dependencies...

✓ Installing dependencies...

Running application...

✓ Running application...

Preview Ready 🚀
```

---

# Progress Timeline

Display progress as a vertical timeline.

Example

```text
✓ Understanding request

✓ Reading project

✓ Building UI

● Installing packages

○ Starting application

○ Preview
```

Legend

```
○ Pending

● In Progress

✓ Completed

✕ Failed
```

---

# Generation Status Component

Suggested component

```text
Generation Status

✓ Thinking

✓ Reading Project

✓ Building Components

✓ Writing Files

● Installing Packages

○ Running Application
```

This component should be reusable throughout the application.

---

# Event Types

The backend should stream structured events.

Suggested interface

```ts
interface GenerationEvent {
  type:
    | "START"
    | "STEP"
    | "COMPLETE"
    | "ERROR";

  message: string;

  timestamp: number;
}
```

Example

```json
{
  "type": "STEP",
  "message": "Generating code..."
}
```

---

# Transport

Preferred

- Server-Sent Events (SSE)

Alternative

- WebSocket

Simple HTTP polling is acceptable for early development but should be replaced.

---

# Suggested Status Messages

The frontend should support messages such as

```text
Thinking...

Understanding your request...

Reading project files...

Analyzing dependencies...

Building components...

Updating existing files...

Creating new files...

Removing unused files...

Installing packages...

Starting development server...

Launching preview...

Done
```

The exact wording can evolve over time.

---

# Fake Progress (MVP)

During the MVP, not every step needs to be backed by a real backend event.

It's acceptable to simulate progress for operations that happen too quickly or are not yet instrumented.

Example

```text
Thinking...

↓

Reading project...

↓

Generating code...
```

These can be time-based until real events are available.

The user experience takes priority.

---

# Real Progress (Future)

Eventually, each status update should correspond to an actual backend event.

Examples

- Context Builder started
- Claude request sent
- Claude response received
- File parsing started
- Database updated
- WebContainer synced
- Dependencies installed
- Dev server ready

---

# Chat Integration

The latest assistant message should display the generation status.

Example

```text
You

Build me a dashboard

-------------------------

AI

✓ Understanding request

✓ Reading project

✓ Generating components

✓ Updating App.tsx

✓ Installing packages

✓ Starting preview

Preview Ready 🚀
```

---

# Completion State

Once generation finishes

Display

```text
Generation Complete

Preview Ready 🚀
```

Automatically scroll the chat to the newest message.

---

# Failure State

If generation fails

Display

```text
Generation Failed

Reason:

Dependency installation failed.

[ Retry ]
```

Do not leave the user on an infinite loading state.

---

# Cancellation

Future feature.

Not required for MVP.

Eventually users should be able to stop generation midway.

---

# Suggested Folder Structure

```text
apps/frontend/

components/

    chat/

        generation-status.tsx

        progress-step.tsx

        progress-timeline.tsx

hooks/

    use-generation-stream.ts

apps/backend/

src/

    ai/

        stream/

            events.ts

            publisher.ts

            sse.ts
```

---

# Performance Goals

- First progress update within 500ms.
- Never leave the UI idle.
- Progress updates should feel continuous.
- Completion should immediately transition to the live preview.
- UI should remain interactive during generation.

---

# Future Improvements (Not Part of MVP)

Do **NOT** build

- Token-by-token reasoning display
- Parallel task visualization
- Multi-agent timelines
- Progress percentages
- Token usage analytics
- Cost tracking
- AI reasoning visualization
- Interactive generation controls

These can be added after launch.

---

# Out of Scope

- Multi-agent streaming
- Planner visualization
- Internal reasoning
- Execution graphs
- Distributed task progress
- Live token streaming
- Workflow debugging

---

# Acceptance Criteria

The feature is considered complete when

- Generation starts immediately after the user submits a prompt.
- The UI displays progressive status updates.
- Users never see a static loading spinner.
- Progress transitions smoothly between stages.
- Completion automatically updates the preview.
- Failures display a meaningful error message.
- The chat remains responsive throughout generation.

---

# Definition of Done

A user submits a prompt such as

```text
Build me a CRM dashboard.
```

Within moments, they begin seeing a live stream of progress:

```text
✓ Thinking

✓ Reading project

✓ Generating components

✓ Writing files

✓ Installing dependencies

✓ Running application

🚀 Preview Ready
```

The experience feels active and responsive from start to finish, making the AI appear significantly faster even when the total generation time remains unchanged.