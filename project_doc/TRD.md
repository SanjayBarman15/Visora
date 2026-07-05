# Visora — Technical Requirements Document (TRD)

**Status:** Draft
**Companion docs:** PRD.md (product requirements), mova-architecture.md (narrative
architecture), mova_schema_v2.sql (full database schema)
**Last updated:** 2026-07-05

---

## 1. Purpose & scope

This document specifies the technical requirements needed to satisfy the product
requirements in PRD.md. It covers system architecture, component-level specs, data
architecture, non-functional requirements, infrastructure, and technology choices.
It does not cover product rationale (see PRD.md) or narrative walkthroughs (see the
architecture doc) — this is the implementation-facing contract.

---

## 2. System architecture overview

Visora is a multi-agent pipeline orchestrated by LangGraph, backed by an async task
execution layer (Celery + Redis), with a hybrid retrieval system feeding code
generation and a five-layer memory system spanning session-scoped, project-scoped,
and cross-user shared state.

```
apps/web (Next.js)  →  apps/api (FastAPI)  →  LangGraph orchestration
                                                     │
                        ┌────────────────────────────┼────────────────────────────┐
                        │                            │                            │
                 Celery workers              mova-rag (retrieval)          mova-db (data access)
                        │                            │                            │
                 Manim / ffmpeg /              PageIndex + turbovec         Supabase Postgres
                 ElevenLabs                    + Pinecone                   + Pinecone
```

Monorepo layout, build tooling, and package boundaries are defined in
`repo_structure.md` and are not repeated here.

---

## 3. Component specifications

### 3.1 Orchestration layer (`packages/mova-agents`)
- **Requirement:** LangGraph manages a single `PipelineState` Pydantic model per
  session, checkpointed to Redis on every node transition.
- **Requirement:** Each agent node receives only the state slice it needs via a
  dedicated context-builder function — full pipeline state must not be passed
  wholesale to every agent, to bound token cost and avoid context confusion.
- **Requirement:** Node transitions must be resumable — a worker crash mid-pipeline
  must resume only the failed scene(s), not restart the full session.

### 3.2 Agent roster
Each row is a technical contract: input, output, and failure behavior. Model
identifiers are dev-environment values (free NVIDIA NIM endpoints); production model
sourcing is tracked as an open item (§9.4).

| Agent | Function | Real-time RPM budget | On failure |
|---|---|---|---|
| Scout | Multi-turn elicitation; produces validated typed requirements object | 3 | Retry with backoff; surface a conversational error to user after 3 failures |
| Orion | Scene decomposition (planning); complex-scene code review | 10 | Retry; on planning failure, return to Scout for re-elicitation |
| Forge | Code generation and fixing; simple-scene self-review | 8 | Retry up to 3 fix iterations per scene, then best-effort return with a warning flag on that scene |
| Narrator | Voiceover script generation, timed to scene duration | 3 | Retry with backoff; video can complete without narration if this repeatedly fails (flagged, not blocking) |
| Guardian | Safety check on inputs and generated outputs | 2 | Hard block on failure — no silent pass-through |
| Reranker | Reduces top-20 retrieval candidates to top-8 | 2 | Fall back to raw similarity ranking if reranker call fails |
| Lens-Text | Text embeddings | 1 | Retry; blocks retrieval for that query if exhausted |
| Lens-Code | Code embeddings | 1 | Retry; blocks retrieval for that query if exhausted |
| Arbiter | Batch-only nightly scoring, weekly promotion | 0 (batch) | Job retries next scheduled run; does not block real-time pipeline |

- **Requirement:** total real-time budget must stay under the platform's rate cap with
  headroom (currently 30 RPM against a 40 RPM cap) enforced via per-model token buckets.
- **Requirement:** Orion's planning calls must be prioritized over its own
  review-iteration calls so new sessions never queue behind in-progress reviews.

### 3.3 Task execution (`packages/mova-workers`)
- **Requirement:** Celery with a minimum of 5 logically separate queues (e.g. chat/
  elicitation, planning, code generation, rendering, audio) so slow tasks never block
  fast ones.
- **Requirement:** Task IDs must be deterministic — derived from
  `(project_id, scene_index, attempt_number)` — to guarantee idempotent retries with
  no duplicate database records.
- **Requirement:** Failed tasks retry with exponential backoff; tasks exceeding a
  defined max-retry count route to a dead-letter queue (see `dead_letter_queue` table)
  rather than failing silently.

### 3.4 Retrieval (`packages/mova-rag`)
- **Requirement:** Two retrieval branches execute concurrently per scene:
  - **Structured branch:** PageIndex tree search over versioned Manim documentation
    (JSON hierarchical index, Supabase Storage, Redis-cached)
  - **Vector branch:** turbovec (in-process hot tier, promoted docs only, 4-bit
    compressed) → Pinecone fallback (full corpus) if turbovec's result set is weak
- **Requirement:** Vector branch composite ranking: 60% cosine similarity, 25% quality
  score, 15% historical success rate. Hard filters (Manim version match, `is_stale =
  false`) must be applied inside the retrieval call, not as a post-filter pass.
- **Requirement:** Both branches' results merge and pass through Reranker before
  being handed to Forge; final context package is capped at 8 documents.
- **Requirement:** A semantic cache (Upstash Redis, 0.95 cosine threshold, 24h TTL)
  intercepts queries before either branch fires.
- **Requirement:** turbovec index rebuilds automatically after each of Arbiter's
  weekly promotion runs, with a Redis key signaling workers to reload on next task
  pickup — workers must not require a restart to pick up a new index.

### 3.5 Continuous corpus improvement (Arbiter)
- **Requirement:** Nightly job updates each candidate document's quality score using
  40% retrieval success rate, 20% source type weight, 40% current score.
- **Requirement:** Weekly job promotes candidates scoring ≥ 0.65 with ≥ 5 retrieval
  events; promotion sets `rag_documents.is_promoted = true` and triggers a turbovec
  rebuild.
- **Requirement:** New Manim version releases trigger a staleness pass — documents
  referencing changed APIs must be flagged `is_stale = true` and downweighted in
  retrieval, not deleted.

### 3.6 Rendering & media
- **Requirement:** Manim execution must run in a sandboxed subprocess: CPU/memory
  limits enforced, no network access, read-only filesystem, hard timeout (dev default
  30s, configurable via `system_config`).
- **Requirement:** ffmpeg handles final audio/video merge, including sidechain-style
  music ducking (default 30% under voiceover, 60% in silent gaps — configurable).
- **Requirement:** Scene-level regeneration must cascade dirty flags only to
  dependent scenes and reuse cached clips for everything unaffected — full re-render
  on a single-scene fix is not acceptable.

### 3.7 Frontend (`apps/web`)
- **Requirement:** Real-time agent status must stream to the client via Server-Sent
  Events, sourced from the same Redis pub/sub instance used as the Celery broker.
- **Requirement:** Dashboard state (sidebar collapse state, active project, message
  history) managed via zustand; no browser storage APIs (localStorage/sessionStorage)
  — in-memory state only, consistent with artifact/environment constraints.
- **Requirement:** All UI components sourced from shadcn/ui; no parallel component
  library introduced without justification.

---

## 4. Data architecture

Full schema lives in `mova_schema_v2.sql`. Key technical constraints called out here
because they affect application code directly:

- **Ownership boundary:** Supabase pgvector holds only personal memory
  (`user_memory`, `memory_nodes`/`memory_edges`). Pinecone holds the shared corpus.
  `rag_documents.id` doubles as the Pinecone vector ID — no separate mapping table.
- **Embedding dimension constraint:** `user_memory.embedding` is typed `halfvec(4096)`,
  not `vector(4096)` — pgvector's HNSW index caps the plain `vector` type at 2000
  dimensions, and the dev-environment embedding model (`nv-embed-v1`) outputs 4096.
  Any future embedding model swap must re-verify this constraint before migrating.
- **Preference graph traversal:** `memory_nodes`/`memory_edges` use recursive CTEs for
  multi-hop traversal (default max depth: 3 hops, configurable via `system_config`).
  No separate graph database — this must remain performant in plain Postgres or be
  revisited if traversal latency becomes a bottleneck.
- **RLS is mandatory on every user-facing table.** Admin-only tables gate through the
  `is_admin()` function, not ad-hoc role checks.
- **Idempotent migrations:** schema changes should be written as drop-and-recreate
  scripts during pre-launch iteration (current stage) but must move to additive,
  reversible migrations once real user data exists — this is a hard requirement before
  any production launch, since `mova_schema_v2.sql`'s drop-first pattern is destructive.

---

## 5. Non-functional requirements

| Category | Requirement |
|---|---|
| **Latency** | Elicitation responses should feel conversational (< 3s per turn under normal load). Full video generation time scales with scene count due to parallelism, not sequential agent calls. |
| **Availability** | Worker crashes must not lose in-progress sessions — pipeline state checkpointing to Redis is non-negotiable. |
| **Scalability** | turbovec's 4-bit compression exists specifically so the shared corpus fits in memory on modest (Render hobby-tier) instances — any corpus growth strategy must re-evaluate this budget. |
| **Observability** | Every agent call, tool use, and retrieval decision must be traced (LangSmith), tagged by model role and session ID, with structured logs carrying correlation IDs across the Celery task graph. |
| **Security** | Sandboxed code execution for all generated Manim code (§3.6). Guardian safety checks are blocking, not advisory. |
| **Cost control** | Per-model rate limiting must be enforced centrally (token buckets), not left to individual call sites, to prevent runaway spend from a single misbehaving loop. |

---

## 6. Technology stack

| Layer | Technology |
|---|---|
| Repo/build | Bun + Turborepo (JS), uv workspaces (Python) |
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, zustand, TanStack Query, Zod |
| Backend | FastAPI, Pydantic |
| Orchestration | LangGraph |
| Task queue | Celery, Upstash Redis (broker + pub/sub + semantic cache) |
| Database | Supabase PostgreSQL + pgvector |
| Shared corpus vectors | Pinecone |
| Corpus hot tier | turbovec |
| Structured doc search | PageIndex |
| Retrieval glue | LangChain |
| Rendering | Manim, ffmpeg |
| Voice | ElevenLabs |
| External content ingestion | GitHub MCP server, Playwright, YouTube transcript tool, Brave Search |
| Observability | LangSmith |
| Deployment | Vercel (frontend), Render (API + workers) |
| Billing (future) | Dodo Payments |

Full model roster and per-role RPM budgets: see §3.2 and `.env` model configuration.

---

## 7. Testing & QA requirements

- **Requirement:** an offline evaluation suite tracking retrieval MRR and first-pass
  render success rate per animation category, run against prompt/model version changes
  — not just ad hoc manual testing.
- **Requirement:** sandboxed dry-run validation (AST parse + Manim dry-run) is a hard
  gate before any scene reaches the rendering queue — this is a test-in-production-path
  requirement, not a separate QA step.
- **Requirement:** any change to the composite retrieval ranking weights (§3.4) or
  Arbiter's scoring formula (§3.5) must be evaluated against the offline suite before
  deployment, since these are silent-failure-prone (a bad weight change degrades
  quality without throwing errors).

---

## 8. Deployment & environments

- **Dev:** free-tier NVIDIA NIM model endpoints; drop-and-recreate schema iteration
  acceptable; no real user data.
- **Staging (to be established):** production-equivalent model sourcing, additive
  migrations only, synthetic/test data.
- **Production:** licensed/paid model contracts (see §9.4), additive-only migrations,
  RLS fully enforced, admin audit logging active on all admin actions.

---

## 9. Open technical items

1. **Production model sourcing is unresolved.** At minimum, the text embedding model
   (`nv-embed-v1`, dev-only) carries a non-commercial license — must be replaced or
   licensed before any paid launch.
2. **Migration strategy must change before launch.** Current schema iteration uses
   destructive drop-and-recreate scripts; production requires additive, reversible
   migrations (e.g. via a migration tool, not hand-written full-schema files).
3. **Embedding dimension lock-in.** If the production embedding model differs from the
   dev model, `halfvec(4096)` sizing and the Pinecone index dimension both need
   re-verification — this is not a config toggle, it's a schema and index change.
4. **SDK/API phase (PRD §9, Phase 3)** introduces requirements not yet specified here:
   API key issuance/rotation, multi-tenant isolation, per-key rate limiting layered on
   top of the existing shared model budget, usage metering for billing, and public
   OpenAPI documentation. To be specified in a follow-up TRD addendum once Phase 3
   is scheduled.
5. **Redis multi-role risk.** Upstash Redis currently serves as Celery broker, SSE
   pub/sub bus, and semantic cache simultaneously. This is acceptable at current scale
   but should be monitored — if any one role's load pattern starts affecting the
   others, they need to be split into separate instances.
