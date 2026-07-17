# Spec 04 — File Diff Engine

> **Phase:** Day 3-4
> **Priority:** P0 (Core AI Infrastructure)
> **Estimated Time:** 1 Day
> **Status:** Not Started

---

# Goal

Build a File Diff Engine that allows the AI to modify only the files that actually changed.

Instead of regenerating the entire project after every prompt, the AI should return a list of file operations that can be applied directly to the existing project.

This dramatically reduces:

- Generation time
- Token usage
- Database writes
- WebContainer synchronization
- Preview refresh time

This is the foundation for fast iterative editing.

---

# Why This Exists

❌ Bad

```text
User Prompt

↓

Claude

↓

Entire Project

↓

Replace Everything
```

Problems

- Slow
- Expensive
- Breaks unrelated code
- Large responses
- Poor user experience

---

✅ Good

```text
User Prompt

↓

Claude

↓

File Operations

↓

Update Only Changed Files
```

Only modify what actually changed.

---

# High Level Flow

```text
User Prompt

↓

Claude

↓

Structured File Operations

↓

Parse Operations

↓

Apply Changes

↓

Save Database

↓

Sync WebContainer

↓

Hot Reload
```

---

# Responsibilities

## apps/backend

Responsible for

- Receiving AI response
- Parsing file operations
- Validating operations
- Applying changes
- Saving updates
- Returning modified files

---

## apps/frontend

Responsible for

- Displaying generation progress
- Updating file explorer
- Refreshing Monaco
- Syncing WebContainer

The frontend should never determine what changed.

---

# Supported Operations

The File Diff Engine should support three operations.

---

## CREATE

Create a brand new file.

Example

```text
CREATE

src/components/Navbar.tsx

------------------

<file contents>
```

Requirements

- Create folders if needed
- Save to database
- Mount into WebContainer
- Refresh sidebar

---

## UPDATE

Replace the contents of an existing file.

Example

```text
UPDATE

src/App.tsx

------------------

<new contents>
```

Requirements

- Preserve file path
- Replace contents
- Update timestamps
- Refresh Monaco if open
- Sync WebContainer

---

## DELETE

Remove a file.

Example

```text
DELETE

src/old-component.tsx
```

Requirements

- Remove from database
- Remove from file tree
- Remove from WebContainer
- Close editor if open

---

# AI Response Format

Claude should always return structured file operations.

Preferred format

````text
CREATE
src/components/Navbar.tsx

<content>

---

UPDATE
src/App.tsx

<content>

---

DELETE
src/unused.tsx