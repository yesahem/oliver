# Spec 07 — Auto Build & Error Fix

> **Phase:** Day 6-8
> **Priority:** P0 (Reliability)
> **Estimated Time:** 2 Days
> **Status:** Not Started

---

# Goal

Automatically validate every AI-generated change before presenting it to the user.

After every successful code generation, the platform should automatically:

1. Install any new dependencies.
2. Build the project.
3. Capture compiler/runtime errors.
4. Send only the relevant errors back to Claude.
5. Apply the generated fixes.
6. Repeat until the project builds successfully or the retry limit is reached.

The user should receive a working application whenever possible.

---

# Why This Exists

❌ Bad

```text
User

↓

AI generates code

↓

Broken build

↓

User fixes it manually
```

---

✅ Good

```text
User

↓

AI generates code

↓

Build project

↓

Errors found

↓

Claude fixes errors

↓

Build again

↓

Success
```

The AI should attempt to fix its own mistakes before involving the user.

---

# High Level Flow

```text
AI Generation

↓

Apply File Changes

↓

bun install

↓

bun run build

↓

Build Successful?

        │
   Yes  │  No
        ▼
 Return Preview

        │
        ▼
Capture Errors

↓

Send Errors to Claude

↓

Receive File Fixes

↓

Apply Changes

↓

Retry Build

↓

Maximum 3 Attempts
```

---

# Responsibilities

## apps/backend

Responsible for

- Running the build pipeline
- Capturing compiler errors
- Constructing repair prompts
- Calling Claude for fixes
- Applying returned file updates
- Managing retry logic

---

## apps/frontend

Responsible for

- Displaying build progress
- Displaying repair progress
- Showing success state
- Showing failure state after max retries

---

# Build Pipeline

Every AI generation automatically triggers

```bash
bun install
```

↓

```bash
bun run build
```

No manual build step should be required.

> **Note:** The project uses **Bun** exclusively. Never use `npm`, `pnpm`, or `yarn`.

---

# Build Success

If the build succeeds

```text
AI Generation

↓

Build

↓

Success

↓

Update Preview
```

No repair step is required.

---

# Build Failure

If the build fails

```text
AI Generation

↓

Build Failed

↓

Capture Errors

↓

Claude Fix

↓

Apply Fixes

↓

Build Again
```

---

# Capturing Errors

Collect only meaningful diagnostics.

Examples

```text
TypeScript errors

Syntax errors

Missing imports

Missing exports

Missing dependencies

Build failures

Compilation errors
```

Ignore

- Warnings
- Formatting issues
- Lint warnings

Focus only on errors preventing a successful build.

---

# Repair Prompt

The repair request should include

```text
Project Memory

↓

Build Errors

↓

Modified Files

↓

Relevant Source Files

↓

Instructions

Fix the project without changing unrelated code.
```

Do **not** resend the entire repository.

---

# Claude Response

Claude should return structured file operations.

Supported operations

- CREATE
- UPDATE
- DELETE

Reuse the existing File Diff Engine.

No special parser should be required.

---

# Retry Logic

Maximum

```
3 retries
```

Example

```text
Attempt 1

↓

Build Failed

↓

Claude Fix

↓

Attempt 2

↓

Build Failed

↓

Claude Fix

↓

Attempt 3

↓

Build Passed

↓

Success
```

If all retries fail

Stop immediately.

Do not continue generating endlessly.

---

# Repair Strategy

Claude should receive only

- Build errors
- Recently modified files
- Relevant imports
- Project Memory

Never send the full repository.

The objective is to make the smallest possible fix.

---

# Progress Timeline

The frontend should display repair progress.

Example

```text
✓ Generating Code

✓ Writing Files

✓ Installing Dependencies

✓ Building Project

⚠ Build Failed

✓ Fixing Errors

✓ Rebuilding

🚀 Build Successful
```

---

# Failure State

After three failed attempts

Display

```text
Unable to automatically repair the project.

The AI attempted 3 fixes but the project still does not compile.

Please try a different prompt or inspect the build logs.
```

Provide

- Retry button
- View build logs button

---

# Build Logs

Store

- Installation logs
- Build output
- Error diagnostics
- Retry history

This information should be available for debugging.

---

# Suggested Folder Structure

```text
apps/backend/

src/

    ai/

        repair/

            build.ts

            install.ts

            error-parser.ts

            repair-prompt.ts

            retry.ts

            verifier.ts

            logs.ts
```

---

# Build Pipeline

```text
AI Generation

↓

Apply File Operations

↓

bun install

↓

bun run build

↓

Success?

↓

No

↓

Parse Errors

↓

Claude Repair

↓

Apply Fixes

↓

Retry

↓

Max 3 Attempts
```

---

# Error Categories

Support repairing

- TypeScript compilation errors
- Missing imports
- Missing exports
- Missing files
- Missing dependencies
- Build configuration issues
- Syntax errors
- JSX errors

Future support

- Runtime exceptions
- Test failures
- Lint issues

---

# Performance Goals

- Automatically start the build after generation.
- Retry immediately after applying fixes.
- Complete all retries within a reasonable time.
- Never exceed three repair attempts.
- Minimize the number of files sent back to Claude.

---

# Future Improvements (Not Part of MVP)

Do **NOT** build

- Unit testing
- End-to-end testing
- Playwright
- Visual regression
- Screenshot comparison
- Multi-agent verification
- Runtime browser automation
- Dependency upgrades
- Security scanning
- Performance optimization

These can be introduced after launch.

---

# Out of Scope

- Planner
- Verifier Agent
- Fixer Agent
- AST repair
- Parallel repair strategies
- Multiple Claude calls in parallel
- Self-healing runtime
- Production deployment validation

This phase focuses only on ensuring that generated projects compile successfully.

---

# Acceptance Criteria

The feature is considered complete when

- Every AI generation automatically starts a build.
- Dependencies are installed automatically using Bun.
- Build errors are captured.
- Relevant errors are sent back to Claude.
- Claude returns file fixes.
- The fixes are applied automatically.
- The project is rebuilt.
- The repair process stops after three failed attempts.
- Users receive a successful preview whenever the build passes.

---

# Definition of Done

A user generates a feature such as

```text
Add Clerk authentication and a dashboard page.
```

The platform automatically:

1. Applies the generated files.
2. Runs `bun install`.
3. Runs `bun run build`.
4. Detects any build errors.
5. Sends only the relevant errors and modified files back to Claude.
6. Applies the returned fixes.
7. Rebuilds the project.
8. Repeats up to three times if necessary.

If the build succeeds, the live preview is updated automatically.

If all three repair attempts fail, the user is shown a clear error message along with the build logs and an option to retry.