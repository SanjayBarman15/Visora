# Visora — Implementation Workflow

**Status:** Draft
**Companion docs:** PRD.md (why), TRD.md (how), APP_FLOW.md (what the user sees)
**Purpose:** The order to actually build this in, and why — for a solo builder going
from an empty repo skeleton to a working product.

---

## Guiding principle

Build the thinnest possible end-to-end slice first, then add breadth (more scenes),
then depth (retrieval/memory sophistication), then polish, then scale features.
Never build a sophisticated version of something before a crude version of the whole
pipeline has proven itself working, end to end, once.

---

## Phase 0 — Foundation (blocks everything else)

**Build:**
- Run the finalized database schema against Supabase
- FastAPI skeleton with Supabase auth wired in (signup → profile row created)
- Next.js shell deployed and talking to the API (even a trivial health-check call)
- Celery + Redis wired up and proven with one trivial task (not a real agent yet)
- NVIDIA NIM API keys configured, one raw model call working end to end from the
  backend

**Why first:** nothing else can be tested without this working. This phase has zero
product value on its own — it's pure plumbing — but every later phase silently
depends on all of it being solid.

**Definition of done:** a user can sign up, and the backend can successfully make one
real call to one real model and get a response back into the database.

---

## Phase 1 — Single-scene happy path (thinnest possible vertical slice)

**Build:**
- Scout: single-turn version only — take a prompt, extract minimal structured
  requirements, no multi-turn dialogue yet
- Orion: produce exactly one scene (not a real multi-scene plan yet)
- Forge: generate Manim code for that one scene, no retrieval, no review loop —
  whatever the model produces goes straight to render
- Manim sandboxed execution and render for that single scene
- Return the raw rendered clip to the user, no narration, no music, no polish

**Why now:** this proves the entire pipeline shape — LangGraph state passing, Celery
task execution, sandboxed rendering — works at all, before investing in any
sophistication. If this doesn't work, nothing built on top of it will either.

**Why not more:** adding multi-scene, review loops, or retrieval before this works
means debugging three unproven systems at once instead of one.

**Definition of done:** a prompt in the dashboard produces one rendered Manim clip,
reliably, most of the time.

---

## Phase 2 — Multi-scene + parallelism

**Build:**
- Orion producing a real multi-scene plan
- Parallel Celery dispatch — all scenes generate at once, not sequentially
- ffmpeg merge of multiple scene clips into a single video (still no narration)
- Basic scene status tracking in the UI (even if crude)

**Why now:** this is the core architectural bet of the whole product (parallel
generation, not sequential). Proving it works with 2–3 scenes early avoids
discovering concurrency bugs after everything else is built on top of a sequential
assumption.

**Definition of done:** a prompt produces a multi-scene plan, and a merged video with
all scenes in the right order, generated in parallel.

---

## Phase 3 — Review/fix loop + safety gate

**Build:**
- Forge/Orion review-and-fix loop, bounded to a fixed max iteration count
- AST-parse + dry-run validation gate before any scene reaches rendering
- Guardian safety checks on both input and generated output, blocking (not advisory)

**Why now, not earlier:** there's no point reviewing code from a pipeline that
doesn't reliably produce a video at all yet (Phases 1–2). There's also no point
building the knowledge base (Phase 4) to feed *better* code into a review loop that
doesn't exist yet.

**Why not later:** every phase after this generates real code from real users —
safety and self-correction need to exist before broader retrieval or memory features
increase the volume and variety of generated code.

**Definition of done:** a deliberately bad generation self-corrects within the
iteration budget, and a deliberately unsafe prompt is blocked cleanly.

---

## Phase 4 — Retrieval v1 (crude, not the full architecture yet)

**Build:**
- Seed `rag_documents` with an initial set of Manim examples and doc snippets
- One retrieval path only — plain vector similarity search (skip turbovec and
  PageIndex entirely at this stage)
- Reranker integrated into that single path

**Why now:** Forge's generation quality (Phase 3) plateaus quickly without any
reference material. But the full hybrid architecture (PageIndex + turbovec +
Pinecone + Arbiter scoring) is expensive to build and its ROI depends on corpus
scale that doesn't exist yet with zero real users.

**Why not the full version yet:** turbovec's entire value proposition is serving a
large *promoted* corpus efficiently — there's nothing to promote yet. Building it now
would be optimizing a system with no data.

**Definition of done:** generation quality visibly improves when a matching example
exists in the seeded corpus, using the simplest retrieval that could work.

---

## Phase 5 — Narration + audio

**Build:**
- Narrator script generation, timed to scene duration
- ElevenLabs TTS integration
- ffmpeg audio mixing with music ducking
- A small seeded music library

**Why now, not earlier:** narration is a parallel track to the scene pipeline, not a
dependency of it — it only makes sense to add once multi-scene generation (Phase 2)
is stable, since narration timing depends on final scene durations.

**Definition of done:** a generated video has synced narration and background music,
matching the App Flow's Generation screen description of narration as a parallel
track.

---

## Phase 6 — Cross-scene visual memory

**Build:**
- AST parsing extraction of color palettes / coordinate systems / visual constants
  after each scene's dry-run validation
- Injection of that extracted state into subsequent scenes' Forge prompts

**Why now:** this specifically fixes a quality problem that only becomes visible
once multi-scene videos (Phase 2) are common — inconsistent visuals across scenes.
Building it earlier would be solving a problem you can't yet observe.

**Definition of done:** a multi-scene video keeps a consistent color palette and
coordinate system across scenes without the user specifying it twice.

---

## Phase 7 — Frontend dashboard, full version

**Build:**
- Collapsible sidebar with real project data (not mock)
- Real-time SSE status streaming replacing any placeholder/polling approach
- Editable scene plan review UI
- Persistent project history, accurate status badges

**Why now, not earlier:** the backend needed to be worth looking at first. Building
a polished dashboard against a pipeline that didn't reliably work yet would mean
redesigning the UI once real state shapes (retries, partial failures, parallel scene
status) became clear anyway.

**Definition of done:** the full App Flow document (§5–§11) is implemented and
matches actual backend behavior, not a mock.

---

## Phase 8 — Personal memory + preference graph

**Build:**
- `user_memory` population (background extraction job after each project)
- Scout loading personal memory at session start
- `memory_nodes` / `memory_edges` population and 2–3 hop traversal in the context
  builder

**Why this late:** personal memory's value is entirely about *returning* users —
there's no returning-user problem to solve until there are users who've completed at
least one video using everything built in Phases 1–7. Building this earlier means
building for a scenario you can't yet test.

**Definition of done:** a returning user's second project skips questions Scout
already knows the answer to, and at least one preference-graph suggestion (e.g. a
color palette) surfaces correctly on a related topic.

---

## Phase 9 — Retrieval v2 (full hybrid architecture)

**Build:**
- Migrate shared corpus to Pinecone
- Add PageIndex over structured documentation
- Add turbovec hot tier + Arbiter's nightly scoring / weekly promotion jobs
- Add the semantic cache

**Why this late:** this is the single most expensive infrastructure investment in
the whole system, and its entire value proposition (§4 of the RAG doc: "ROI is
proportional to corpus size") requires a corpus and usage history that only exists
after Phases 1–8 have been running and generating real retrieval logs.

**Definition of done:** retrieval quality and latency measurably improve over the
Phase 4 baseline, with real usage data to prove it — not a rebuild for its own sake.

---

## Phase 10 — Post-generation editing

**Build:**
- Single-scene regeneration with dirty-flag cascade (reusing cached clips elsewhere)
- Audio-only fast-path adjustment

**Why this late:** this is a refinement on top of a generation pipeline that needs
to already be trustworthy — there's little point optimizing the *edit* experience
before the *first-generation* experience is solid across Phases 1–9.

**Definition of done:** fixing one scene in a finished video doesn't cost a full
re-render, and an audio-only tweak returns in seconds, matching App Flow §10.

---

## Phase 11 — Hardening & production readiness

**Build:**
- LangSmith tracing across every agent/tool/retrieval call
- Dead-letter queue handling and an admin view for it
- Migration strategy switched from destructive drop-and-recreate to additive,
  reversible migrations
- Production model sourcing resolved (commercial licensing, embedding dimension
  re-verification if the model changes)
- Billing integration (Dodo Payments) if launching paid tiers

**Why this late, but before SDK:** this is the last gate before real users and real
money touch the system. Everything in Phases 1–10 was allowed to be a little fragile
during iteration; this phase is where that stops being acceptable.

**Definition of done:** the system meets the non-functional requirements in
TRD.md §5, and a schema migration can be applied without dropping existing data.

---

## Phase 12 — SDK / public API (explicitly last)

**Build:**
- API key issuance, rotation, revocation
- Multi-tenant isolation
- Per-key rate limiting layered on top of the existing shared model budget
- Usage metering for billing
- Public OpenAPI docs, published client SDKs (Python, JS/TS)

**Why last:** this turns Visora from a product into a platform other developers
depend on — that's a much higher support and stability bar, and it's only a
reasonable investment once the core product (Phases 1–11) is proven and stable for
Visora's own users. Shipping this early risks committing to an API contract before
you've learned enough from real usage to know it's the right one.

**Definition of done:** a third-party developer can generate a video through the API
alone, with billing and rate limits enforced correctly, without touching the
dashboard at all.

---

## Build-first / build-last summary

| Build first | Build last |
|---|---|
| Phase 0 — infra plumbing | Phase 12 — SDK/public API |
| Phase 1 — single-scene happy path | Phase 11 — production hardening |
| Phase 2 — multi-scene parallelism | Phase 10 — post-generation editing |
| Phase 3 — review/fix + safety | Phase 9 — full retrieval architecture |

The throughline: **prove the pipeline, then make it good, then make it remember you,
then make it fast/cheap at scale, then make it a platform.** Skipping ahead on any of
these (especially building Phase 9's retrieval sophistication or Phase 12's SDK
before the core loop is solid) is the most likely way to burn time on infrastructure
that has to be rebuilt once real usage patterns are known.
