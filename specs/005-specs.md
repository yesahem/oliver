# Spec 05 — Prompt Context Builder

> **Phase:** Day 4-5
> **Priority:** P0 (Core AI Infrastructure)
> **Estimated Time:** 1-2 Days
> **Status:** Not Started

---

# Goal

Build the intelligence layer that prepares context before every AI request.

Instead of sending the **entire project** to the LLM on every prompt, the Prompt Context Builder should collect only the most relevant information needed to complete the user's request.

This reduces:

- Token usage
- Latency
- Cost
- Hallucinations

This component will become one of the platform's biggest competitive advantages.

---

# Why This Exists

❌ Bad

```text
User Prompt

↓

Entire Repository

↓

Claude
```

Large repositories quickly become expensive and slow.

---

✅ Good

```text
User Prompt

↓

Prompt Context Builder

↓

Relevant Context

↓

Claude
```

Only send what the model actually needs.

---

# High Level Flow

```text
User Prompt

↓

Context Builder

↓

Current File

+

Imported Files

+

Recently Edited Files

+

Recent Chat

+

package.json

+

Project Summary

↓

Claude
```

---

# Responsibilities

## apps/backend

Responsible for

- Building AI context
- Collecting project metadata
- Resolving imports
- Finding edited files
- Fetching recent chat
- Creating the final Claude prompt

---

## apps/frontend

Responsible for

- Sending current editor state
- Sending current open file
- Sending user prompt

No AI logic should live in the frontend.

---

# Context Sources

The Prompt Context Builder should collect the following pieces of information.

---

## 1. User Prompt

Always include.

Example

```text
Add authentication using Clerk.
```

---

## 2. Current Open File

The file currently visible inside Monaco.

Example

```text
src/App.tsx
```

Include

- file path
- file contents

Reason

This is usually the file the user is actively editing.

---

## 3. Imported Files

Automatically resolve imports from the current file.

Example

```tsx
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
```

Include

- imported file path
- imported file contents

Do not recursively import the entire project.

Only one level deep for MVP.

---

## 4. Recently Edited Files

Collect recently modified files.

Suggested limit

```
Last 5 edited files
```

Include

- file path
- file contents

Reason

These files likely contain the latest project state.

---

## 5. Recent Chat

Collect only the most recent conversation.

Suggested limit

```
Last 5 messages
```

Do not send the entire chat history.

Reason

Recent conversations usually contain the current intent.

---

## 6. package.json

Always include

Reason

Claude needs to know

- framework
- dependencies
- scripts
- versions

---

## 7. Project Summary

Maintain a short summary describing the project.

Example

```text
React SaaS dashboard.

Uses:

- Bun
- Vite
- Tailwind
- shadcn/ui
- Prisma

Current Features:

- Dashboard
- Authentication
- Settings Page
```

This summary should be updated after every successful generation.

---

# Context Assembly

Final prompt structure

```text
System Prompt

↓

Project Summary

↓

package.json

↓

Current File

↓

Imported Files

↓

Recently Edited Files

↓

Recent Chat

↓

User Prompt
```

This ordering should remain consistent.

---

# Context Limits

To avoid excessive token usage

Maximum context should include

- 1 current file
- 1 level of imports
- Last 5 edited files
- Last 5 chat messages
- package.json
- Project summary

Never send the full repository.

---

# Context Builder Service

Suggested structure

```text
apps/backend/

src/

    ai/

        context/

            build-context.ts

            current-file.ts

            imports.ts

            edited-files.ts

            project-summary.ts

            recent-chat.ts

            package-json.ts
```

---

# Context Object

Suggested internal structure

```ts
interface PromptContext {
  projectSummary: string

  packageJson: string

  currentFile: File

  importedFiles: File[]

  editedFiles: File[]

  recentChat: Message[]

  userPrompt: string
}
```

---

# Prompt Generation

Example

```text
You are an expert React engineer.

Project Summary

...

package.json

...

Current File

src/App.tsx

...

Imported Files

Navbar.tsx

Hero.tsx

...

Recently Edited Files

Dashboard.tsx

Sidebar.tsx

...

Recent Chat

...

User Request

Add authentication using Clerk.
```

---

# Performance Goals

The Context Builder should

- Minimize token usage
- Prioritize relevant files
- Avoid duplicate files
- Build context in under 200ms
- Reuse cached project metadata when possible

---

# Error Handling

## Missing Current File

Continue without it.

---

## Missing Imported File

Skip it.

Do not fail the request.

---

## Missing Chat History

Proceed with only the user prompt.

---

## Missing Project Summary

Generate an empty summary.

---

# Future Improvements (Not Part of MVP)

These are intentionally excluded.

- AST analysis
- Symbol graph
- Embedding search
- Vector database
- Semantic retrieval
- Dependency graph traversal
- AI-generated summaries per file
- Automatic relevance scoring
- Long-term memory

These will be introduced after launch.

---

# Out of Scope

Do **NOT** build

- Full repository indexing
- Recursive dependency analysis
- Multi-agent retrieval
- Graph database
- Embedding pipelines
- pgvector
- Context ranking
- AST parsing
- RAG
- File similarity search

---

# Acceptance Criteria

The feature is considered complete when

- Backend builds a context object for every prompt.
- Current open file is included.
- Direct imports are included.
- Recently edited files are included.
- Recent chat messages are included.
- package.json is included.
- Project summary is included.
- The final Claude prompt contains only these pieces of information.

---

# Definition of Done

A user submits a prompt, and instead of sending the entire repository, the backend automatically builds a concise, relevant context containing:

1. The current file.
2. Its direct imports.
3. The last edited files.
4. Recent conversation history.
5. The project's `package.json`.
6. A short project summary.
7. The user's latest prompt.

This optimized context is then sent to Claude, resulting in faster responses, lower costs, and more accurate code generation.