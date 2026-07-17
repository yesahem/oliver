# Spec 09 — Incremental Editing

> **Phase:** Day 9-11
> **Priority:** P0 (Core Product Experience)
> **Estimated Time:** 2-3 Days
> **Status:** Not Started

---

# Goal

Transform the AI from a **code generator** into a **code editor**.

Instead of regenerating an entire application after every prompt, the AI should understand the user's intent and modify only the relevant parts of the existing project.

This is the feature that makes the product feel like a true AI software engineer rather than a one-time website generator.

---

# Why This Exists

❌ Bad

```text
User

↓

"Make the navbar blue"

↓

Regenerate 150 files

↓

Replace project
```

Problems

- Slow
- Expensive
- Breaks unrelated code
- Poor user experience

---

✅ Good

```text
User

↓

"Make the navbar blue"

↓

Understand intent

↓

Find Navbar component

↓

Update Navbar.tsx

↓

Preview updates
```

Only the relevant files should change.

---

# High Level Flow

```text
User Prompt

↓

Understand Intent

↓

Build Context

↓

Claude

↓

File Operations

↓

Apply Changes

↓

Preview Updates
```

---

# Responsibilities

## apps/frontend

Responsible for

- Chat UI
- Displaying generation progress
- Updating Monaco
- Updating file explorer
- Refreshing preview

---

## apps/backend

Responsible for

- Building prompt context
- Including project memory
- Calling Claude
- Parsing file operations
- Applying changes
- Saving updated files

---

# Supported Editing Requests

The AI should support iterative modifications such as

```text
Add login

Add authentication

Add Stripe

Add dashboard

Add sidebar

Fix bug

Fix TypeScript errors

Make navbar blue

Replace logo

Dark mode

Responsive layout

Add settings page

Improve landing page

Refactor dashboard

Add loading states

Update button styles

Add charts

Remove feature

Rename component
```

The goal is to continuously evolve the project rather than regenerate it.

---

# Context for Every Edit

Every edit request should include

```text
Project Memory

↓

Prompt Context

↓

Relevant Files

↓

Recent Chat

↓

User Prompt
```

Do **not** send the entire repository.

Reuse the Prompt Context Builder.

---

# Editing Principles

Every edit should follow these principles.

## Preserve Existing Code

Do not rewrite working code unnecessarily.

---

## Smallest Possible Change

Modify only the files required.

Avoid unrelated edits.

---

## Preserve Project Structure

Do not reorganize folders unless explicitly requested.

---

## Maintain Existing Style

Respect

- Existing components
- Existing design
- Existing architecture
- Existing naming conventions

The AI should blend into the current project.

---

# File Operations

Reuse the existing File Diff Engine.

Supported operations

- CREATE
- UPDATE
- DELETE

No full project replacement.

---

# Example 1

User

```text
Make the navbar blue.
```

Expected

```
UPDATE

src/components/Navbar.tsx
```

Only one file changes.

---

# Example 2

User

```text
Add dark mode.
```

Expected

```
UPDATE

tailwind.config.ts

UPDATE

ThemeProvider.tsx

UPDATE

App.tsx
```

Only affected files change.

---

# Example 3

User

```text
Add Clerk authentication.
```

Expected

```
UPDATE

package.json

CREATE

middleware.ts

UPDATE

App.tsx

UPDATE

routes.ts
```

Only authentication-related files change.

---

# Example 4

User

```text
Fix the login bug.
```

Expected

Claude should

- inspect recent context
- identify affected files
- modify only the relevant code

Not regenerate the application.

---

# Chat Experience

Example

```text
User

Make the dashboard responsive.

↓

AI

Understanding request...

Reading dashboard...

Updating layout...

Applying changes...

Preview Ready 🚀
```

The interaction should feel conversational.

---

# Editing Workflow

```text
User Prompt

↓

Load Project Memory

↓

Build Prompt Context

↓

Claude

↓

Receive File Operations

↓

Apply Changes

↓

Save Files

↓

Sync WebContainer

↓

Hot Reload

↓

Preview Ready
```

---

# Project Memory Integration

Every edit should include

```text
Project Memory

Framework

UI Library

Database

Authentication

Theme

Summary
```

This prevents the AI from forgetting previous architectural decisions.

---

# Prompt Context Integration

Reuse

- Current file
- Imported files
- Recent edits
- package.json
- Recent chat
- Project summary

Do not rebuild context from scratch.

---

# Auto Build Integration

Every incremental edit automatically triggers

```text
Apply Changes

↓

bun install (if needed)

↓

bun run build

↓

Auto Repair (if needed)

↓

Preview
```

The user should receive working code whenever possible.

---

# Suggested Folder Structure

```text
apps/backend/

src/

    ai/

        edit/

            edit.ts

            context.ts

            prompt.ts

            operations.ts

            apply.ts
```

---

# Performance Goals

- Edit requests should feel faster than initial generation.
- Modify only affected files.
- Minimize Claude token usage.
- Avoid unnecessary file updates.
- Preserve preview responsiveness.

---

# Future Improvements (Not Part of MVP)

Do **NOT** build

- AST-based editing
- Symbol graph
- Dependency graph
- Semantic patching
- Multi-agent editing
- Planner
- Automatic feature planning
- Git patch generation
- Merge conflict resolution

These will come after launch.

---

# Out of Scope

- Full project regeneration
- Architecture redesign
- Project migration
- Framework migration
- Multi-project editing
- Collaborative editing
- Undo history
- Branching

---

# Acceptance Criteria

The feature is considered complete when

- Users can modify an existing project using natural language.
- Existing code is preserved.
- Only relevant files are updated.
- Project Memory is included in every edit.
- Prompt Context is reused.
- File Diff Engine applies only modified files.
- Auto Build validates every edit.
- The preview updates automatically after successful changes.

---

# Definition of Done

A user starts with an existing application and can continue improving it through natural language prompts such as:

```text
Add login

Make the navbar blue

Add Stripe payments

Fix the dashboard bug

Enable dark mode

Make the landing page responsive
```

Each request updates only the necessary files, preserves the existing project structure, automatically rebuilds the application, and refreshes the live preview.

At this point, the platform evolves from a one-time app generator into an AI-powered development environment capable of iterative software development.