##  MVP Roadmap (what to actually build first)

**Phase 1 — Sequential pipeline, prove the contract-first idea works at all**
- Planner → Schema Agent → Backend Agent → Frontend Agent, run *sequentially* (skip parallelism for now)
- WebContainer + PGlite preview
- No Verifier/Fixer loop yet — just show whatever gets generated
- Single orchestrator process, Postgres task table (no queue/bus yet)
- Goal: validate that contract-first codegen actually produces coherent full-stack apps

**Phase 2 — Parallelism + verification**
- Backend/Frontend agents run concurrently (this is where your event bus/queue earns its place)
- Add Verifier (typecheck + boot check) and Fixer with a capped retry loop
- Add the Context/Retrieval Agent so follow-up prompts are scoped, not full-context

**Phase 3 — Production hardening**
- Swap Postgres-table scheduler for Temporal (or harden your own with proper idempotency)
- Add Deploy Agent + real managed Postgres target
- Add per-project token budgets, prompt caching, multi-tenant isolation
- Add snapshot/rollback (project versions become restorable)

**What I'd deliberately *not* build in Phase 1**, even though it's tempting: multi-agent parallelism, the full DAG scheduler, and the Fixer loop. Prove contract-first codegen quality first — that's the actual bet your whole platform rests on, and it's cheap to validate sequentially before you invest in the orchestration machinery around it.

---
