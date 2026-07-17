# Spec 08 — Project Memory

> **Phase:** Day 8-9
> **Priority:** P1 (AI Quality)
> **Estimated Time:** 1 Day
> **Status:** Not Started

---

# Goal

Build a persistent **Project Memory** system that captures the important facts about a project so the AI does not need to rely on the entire chat history.

Instead of sending dozens of previous messages, every AI request should include a concise project memory describing the application's architecture, technologies, and current state.

This reduces:

- Prompt size
- Token usage
- Context pollution
- Repeated explanations
- AI inconsistencies

Project Memory becomes the AI's long-term understanding of the project.

---

# Why This Exists

❌ Bad

```text
User Prompt

↓

Entire Chat History

↓

Claude
```

Problems

- Expensive
- Slow
- Important information gets buried
- AI forgets earlier decisions
- Context window eventually fills up

---

✅ Good

```text
User Prompt

↓

Project Memory

+

Recent Chat

↓

Claude
```

The AI immediately understands the project without rereading months of conversations.

---

# High Level Flow

```text
Project Created

↓

Initialize Project Memory

↓

User Generates Features

↓

Update Memory

↓

Future Prompt

↓

Project Memory

+

Recent Chat

↓

Claude
```

---

# Responsibilities

## apps/backend

Responsible for

- Creating project memory
- Updating memory after successful generations
- Reading memory before AI requests
- Including memory in every prompt

---

## apps/frontend

Responsible for

- Displaying project information (future)
- Triggering memory refresh (future)

The frontend should never edit project memory directly.

---

# Project Memory File

Each project should maintain a single memory object.

Suggested filename

```text
project.json
```

Example

```json
{
  "framework": "React",
  "runtime": "Vite",
  "language": "TypeScript",
  "packageManager": "Bun",
  "ui": "shadcn/ui",
  "styling": "Tailwind CSS",
  "database": "Postgres",
  "orm": "Prisma",
  "auth": "Clerk",
  "theme": "Dark",
  "summary": "Task management application with teams, comments and authentication."
}
```

This object should always represent the current state of the project.

---

# Memory Fields

Minimum fields

```json
{
  "framework": "",
  "runtime": "",
  "language": "",
  "packageManager": "",
  "ui": "",
  "styling": "",
  "database": "",
  "orm": "",
  "auth": "",
  "theme": "",
  "summary": ""
}
```

Additional fields can be added in future versions.

---

# Summary

The summary should be short.

Target

```
50–150 words
```

Example

```text
Task management application built with React, Vite, Prisma and PostgreSQL.

Current features include authentication, project management, teams, comments, dashboards and settings.

Uses shadcn/ui with Tailwind CSS.
```

Avoid large summaries.

---

# Memory Lifecycle

## Project Creation

Initialize a blank memory.

Example

```json
{
  "framework": "React",
  "runtime": "Vite",
  "language": "TypeScript",
  "summary": ""
}
```

---

## After Successful Generation

Once AI successfully modifies the project

↓

Update project memory.

Examples

User

```text
Add Clerk authentication.
```

Memory becomes

```json
{
  "auth": "Clerk"
}
```

---

User

```text
Switch to Supabase Auth.
```

Memory updates to

```json
{
  "auth": "Supabase"
}
```

Always keep the latest state.

---

# AI Prompt Integration

Every AI request should include

```text
System Prompt

↓

Project Memory

↓

Recent Chat

↓

Relevant Files

↓

User Prompt
```

Project Memory should always appear before the project files.

---

# Updating Memory

Memory should be updated only after successful file generation.

Do not update memory if

- generation fails
- file parsing fails
- database write fails

Memory should always match the actual project.

---

# Storage

Store project memory alongside the project.

Suggested database model

```text
Project

id

name

memory (JSON)

createdAt

updatedAt
```

The memory should be stored as JSON for easy updates.

---

# Suggested Folder Structure

```text
apps/backend/

src/

    ai/

        memory/

            create-memory.ts

            read-memory.ts

            update-memory.ts

            summarize.ts

            prompt-memory.ts
```

---

# Future Improvements (Not Part of MVP)

These are intentionally excluded.

- AI-generated architecture diagrams
- Dependency graph memory
- Symbol memory
- Component summaries
- File summaries
- User preferences
- Coding style memory
- Vector database
- Embedding search
- Automatic architecture detection
- Feature dependency graph

---

# Out of Scope

Do **NOT** build

- Long-term chat storage
- Embedding memory
- RAG
- Knowledge graph
- AST memory
- Automatic codebase indexing
- File-level summaries
- Semantic search

---

# Performance Goals

- Load memory in under 20ms.
- Memory should remain under 2KB.
- Include memory in every AI request.
- Update memory only after successful generations.
- Keep summaries concise and relevant.

---

# Acceptance Criteria

The feature is considered complete when

- Every project has a Project Memory object.
- Memory is created when a project is initialized.
- Memory is stored in the database.
- Memory is updated after successful AI generations.
- Every AI request automatically includes Project Memory.
- The AI no longer relies on the full chat history for long-term context.

---

# Definition of Done

A user builds a project over multiple AI interactions.

Instead of sending the entire conversation history, every new AI request includes a concise Project Memory such as:

```json
{
  "framework": "React",
  "runtime": "Vite",
  "language": "TypeScript",
  "packageManager": "Bun",
  "ui": "shadcn/ui",
  "styling": "Tailwind CSS",
  "database": "Postgres",
  "orm": "Prisma",
  "auth": "Clerk",
  "theme": "Dark",
  "summary": "Task management application with teams, authentication, dashboards and comments."
}
```

The AI immediately understands the project's architecture and current state, resulting in faster, cheaper and more consistent code generation across long conversations.