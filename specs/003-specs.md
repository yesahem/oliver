# Spec 03 — Single AI Code Agent

> **Phase:** Day 2-3
> **Priority:** P0 (Highest)
> **Estimated Time:** 1-2 Days
> **Status:** Not Started

---

# Goal

Build the first AI coding experience.

The objective is simple:

A user writes a prompt, the AI understands the current project, generates code changes, and applies those changes directly to the project.

This is intentionally a **single-agent architecture**.

There is:

- No Planner
- No Orchestrator
- No Verifier
- No Task Queue
- No Multiple Agents

The AI should behave like an intelligent coding assistant that edits the existing project.

---

# High Level Flow

```text
User Prompt

↓

Collect Project Context

↓

Send Request to Claude

↓

Receive File Changes

↓

Apply Changes

↓

Save Files

↓

WebContainer Hot Reload

↓

Updated Preview
```

---

# Existing Architecture

```text
Frontend

↓

Backend API

↓

Claude API

↓

Generated File Changes

↓

Database

↓

WebContainer

↓

Live Preview
```

---

# Responsibilities

## apps/frontend

Responsible for

- Chat UI
- Sending prompts
- Displaying generation state
- Receiving streamed responses
- Applying UI updates

---

## apps/backend

Responsible for

- Claude API communication
- Context building
- Prompt construction
- Response parsing
- Saving updated files

---

## packages/db

Responsible for

- Project files
- Project metadata
- Chat history

---

# Features

## 1. User Prompt

The user should be able to enter a prompt from the chat panel.

Examples

```text
Build a landing page

Add authentication

Create a pricing page

Add dark mode

Make the navbar sticky
```

Requirements

- Multi-line input
- Send button
- Enter to send
- Disable input while generating

---

## 2. Build Project Context

Before calling Claude,

collect the current project context.

Minimum context should include

- Project name
- File tree
- File contents
- Previous chat messages
- Current open file (optional)

The entire project can be sent for MVP.

Optimization comes later.

---

## 3. Construct Claude Request

Backend should construct a single request containing

- System Prompt
- User Prompt
- Current Project Files

Example

```text
System Prompt

You are an expert software engineer...

Current Files

src/App.tsx

...

src/main.tsx

...

package.json

...

User Request

Build a beautiful landing page.
```

---

## 4. Send Request to Claude

Backend communicates with Claude.

Requirements

- Streaming preferred
- Retry on transient failures
- Timeout handling
- Error handling

Only one request should be active per project.

---

## 5. Receive File Changes

Claude should return **structured file edits**, not explanations.

Preferred format

```text
CREATE

src/components/Navbar.tsx

--------------------

<content>

UPDATE

src/App.tsx

--------------------

<content>

DELETE

src/old.ts
```

Avoid free-form markdown responses.

The response should be machine-readable.

---

## 6. Parse Response

Backend parses the generated file operations.

Supported operations

- CREATE
- UPDATE
- DELETE

Ignore unsupported operations.

Return structured file objects.

---

## 7. Apply File Changes

Apply the generated changes to

- Database
- WebContainer

Requirements

- Create new files
- Update existing files
- Delete removed files
- Preserve folder structure

---

## 8. Save Files

Every generated file should immediately be persisted.

Requirements

- Update database
- Update timestamps
- Maintain file hierarchy

The database remains the source of truth.

---

## 9. Trigger Live Refresh

After files are written,

the WebContainer should automatically refresh.

No manual refresh required.

---

# Chat Experience

States

---

## Idle

```text
Ask AI to build something...
```

---

## Generating

Display

```text
Thinking...

Generating code...

Updating files...
```

Disable input while generating.

---

## Success

Append

```text
Done.
```

Preview updates automatically.

---

## Failure

Display

```text
Generation failed.

Retry
```

---

# Backend APIs

## Generate

```
POST /ai/generate
```

Body

```json
{
  "projectId": "...",
  "prompt": "Build a dashboard"
}
```

Response

```json
{
  "success": true
}
```

Streaming responses are preferred.

---

# Suggested Folder Structure

```text
apps/backend/

src/

    ai/

        prompt.ts

        context.ts

        parser.ts

        generator.ts

        file-writer.ts

        routes.ts
```

---

# Suggested Frontend Structure

```text
apps/frontend/

hooks/

    use-ai.ts

components/

    chat/

        chat-input.tsx

        chat-history.tsx

        generation-status.tsx
```

---

# Runtime Flow

```text
User Prompt

↓

Build Context

↓

Claude API

↓

Receive File Operations

↓

Parse Response

↓

Write Files

↓

Save Database

↓

Sync WebContainer

↓

Preview Updates
```

---

# Error Handling

## Claude API Failure

Display

```text
Unable to generate code.
```

Allow retry.

---

## Invalid Response

Display

```text
AI returned an invalid response.
```

Do not modify files.

---

## File Write Failure

Display

```text
Unable to save generated files.
```

Rollback partial writes if possible.

---

## Timeout

Display

```text
Generation timed out.
```

Allow retry.

---

# Performance Goals

- First token within a few seconds.
- Apply file updates immediately after parsing.
- Keep chat responsive during generation.
- Avoid blocking the UI.
- Minimize unnecessary database writes.

---

# Out of Scope

Do **NOT** build any of the following in this phase.

- Multi-agent architecture
- Planner
- Orchestrator
- Task queues
- OpenAPI generation
- Verification
- Automatic bug fixing
- AST analysis
- Context retrieval
- Embedding search
- Project memory
- Incremental diff planning
- Deployment

---

# Acceptance Criteria

The feature is considered complete when

- User can enter a prompt.
- Backend builds the current project context.
- Claude receives the prompt and project files.
- Claude returns structured file edits.
- Backend parses the response.
- Generated files are written to the database.
- WebContainer receives updated files.
- Preview refreshes automatically.

---

# Definition of Done

A user can:

1. Open a project.
2. Type a prompt such as:

```text
Build a beautiful SaaS landing page.
```

3. Watch the AI generate code.
4. Have new files automatically created.
5. Have existing files updated.
6. See the preview refresh with the generated application.

This milestone delivers the first end-to-end AI coding workflow and serves as the foundation for future enhancements like diff-aware editing, verification, and multi-agent orchestration.