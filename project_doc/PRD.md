# Visora — Product Requirements Document

**Status:** Draft
**Owner:** Solo builder / founder
**Last updated:** 2026-07-05

---

## 1. Summary

Visora is an AI platform that turns a text prompt into a fully narrated, code-generated
explainer animation. A user describes a topic in plain language; a coordinated system
of AI agents plans, writes, reviews, renders, and narrates a finished video — without
the user writing any Manim (Python animation library) code themselves.

The core bet: generic AI video tools produce visually impressive but mathematically
loose output. Visora generates *actual animation code*, reviewed and dry-run validated
before rendering, so the result is precise — closer to a hand-coded 3Blue1Brown-style
video than a diffusion-generated clip.

---

## 2. Problem

Creating precise, code-driven educational or technical animation today requires:
- Learning Manim (or a comparable animation library) — a real programming skill
- Significant per-video time investment even for someone who already knows Manim
- No easy way to iterate on a video's plan before committing to full production

Existing AI video generators solve a different problem — they produce visually
compelling but non-precise output (no real coordinate systems, no accurate diagrams,
no code-verifiable correctness). There's no accessible tool for someone who wants
*correct*, explainable, math/science-grade animation without the engineering overhead.

---

## 3. Target users

| Persona | Need |
|---|---|
| Educator / teacher | Wants a clear, accurate visual explanation of a concept for a class, without animation skills |
| Student / self-learner | Wants to generate a video to understand a concept they're struggling with |
| Technical content creator | Wants to produce explainer videos (YouTube, course content) faster than hand-coding Manim |
| Developer (future, via SDK) | Wants to embed Visora's generation capability into their own product |

The primary persona for v1 is the **educator/content creator** — someone who could
technically learn Manim but wants the process compressed from hours to minutes.

---

## 4. Goals

- A user can go from a text prompt to a finished, narrated video with zero manual
  editing required, in a single sitting.
- The user can review and adjust the video's plan (scene breakdown) before generation
  commits real compute to it.
- The system should feel *conversational*, not form-based — requirements are gathered
  through dialogue, not a rigid intake form.
- Returning users shouldn't have to restate preferences (style, tone, audience level)
  they've already established.
- Generated code should be self-correcting: the system catches and fixes its own
  errors before a user ever sees a failed render.

## 4.1 Non-goals (for v1)

- Manual, timeline-based video editing (this is prompt-to-video, not a video editor)
- Real-time collaborative editing between multiple users on one project
- Support for non-Manim animation engines
- Public API / third-party SDK access (explicitly phase 2 — see §9)

---

## 5. Core user flow

1. **Start** — user opens a new project from the dashboard (central input, or "New
   video" from the sidebar) and describes what they want.
2. **Elicitation** — the system asks follow-up questions conversationally (audience
   level, tone, depth, style preferences) until it has enough to plan. Returning users'
   known preferences are pre-loaded so they aren't asked to repeat themselves.
3. **Planning** — the system proposes a scene-by-scene breakdown. The user can reorder,
   rename, edit, or delete scenes before approving.
4. **Generation** — on approval, all scenes generate in parallel: relevant reference
   material is retrieved, code is written, self-reviewed, fixed if needed, and dry-run
   validated before rendering. Narration is written and timed in parallel.
5. **Assembly** — rendered scenes, narration audio, and background music combine into
   one final video.
6. **Delivery & iteration** — the user gets the finished video. If something's off in
   one scene, only that scene regenerates and the video re-assembles — the user never
   waits for a full re-render over a small fix.

---

## 6. Feature requirements

### 6.1 Dashboard / app shell
- Collapsible left sidebar: new-video action, scrollable project history, user menu
- Centered input as the primary entry point for a new project (large textarea, example
  prompt chips)
- Conversation view once a project starts, with the composer at the bottom
- Project list shows status per project (e.g. in progress, rendering, done)

### 6.2 Elicitation (Scout)
- Multi-turn conversation, not a static form
- Can ingest external references the user provides (a GitHub repo, a YouTube link, a
  web page) to inform the plan
- Loads the user's known preferences at session start (returning users)

### 6.3 Planning (Orion)
- Produces an editable, ordered scene plan with per-scene descriptions and estimated
  duration
- User approval gate before any generation compute is spent

### 6.4 Generation pipeline
- Per-scene: retrieve reference material → generate code → review → fix (bounded
  retry) → dry-run validate → render
- Scenes generate in parallel, not sequentially
- Narration generates in parallel with scene rendering, timed to match

### 6.5 Memory (cross-session and cross-scene)
- Visual consistency within a single video: colors, coordinate systems, and visual
  conventions established in scene 1 should carry through to later scenes automatically
- Personal preference memory across sessions: style, tone, audience level, and topical
  interests persist without the user restating them
- A preference *graph* (not just a flat list) surfaces non-obvious connections — e.g.
  suggesting a color palette the user used for one topic when they start a related but
  different topic

### 6.6 Shared knowledge base
- A continuously improving shared corpus of animation code patterns and documentation,
  benefiting all users, not just the individual who created a given example
- The corpus self-curates over time: patterns that reliably produce good renders are
  promoted; patterns tied to outdated APIs are flagged and demoted

### 6.7 Post-generation editing
- Regenerating a single scene should not require re-rendering the whole video
- Audio-only adjustments (narration tweaks, music swap) should apply without touching
  visual scenes at all

---

## 7. Success metrics

| Metric | Why it matters |
|---|---|
| First-pass render success rate (no user-triggered fix needed) | Direct measure of generation quality |
| Time from prompt submission to finished video | Core value proposition is speed vs. manual Manim coding |
| Returning-user session count where prior preferences were correctly recalled | Validates the memory system is actually useful, not just present |
| % of videos where the user edited the scene plan before approving | Signals whether the planning step is trusted as-is or needs more control |
| Retrieval precision (relevant reference material actually used in final accepted code) | Validates the RAG/knowledge base investment |

---

## 8. Technical approach (summary — see architecture doc for full detail)

- **Orchestration:** LangGraph coordinates 8 specialized models (Scout, Orion, Forge,
  Narrator, Guardian, Reranker, Lens-Text, Lens-Code) plus a batch-only quality agent
  (Arbiter)
- **Execution:** Celery + Redis for async task execution across separate queues so
  slow work (rendering) never blocks fast work (chat)
- **Data:** Supabase Postgres (projects, scenes, personal memory, preference graph),
  Pinecone (shared corpus vectors), turbovec (in-memory hot tier for proven-good
  examples), PageIndex (structure-aware search over official documentation)
- **Rendering:** Manim (sandboxed subprocess) + ffmpeg (audio mixing, final merge) +
  ElevenLabs (voiceover)
- **Frontend:** Next.js, TypeScript, Tailwind, shadcn/ui, zustand
- Models currently run on free NVIDIA NIM endpoints for development; production model
  sourcing (including checking commercial-use licensing) is a pre-launch task, not yet
  finalized

---

## 9. Roadmap

**Phase 1 — MVP (current focus)**
- Core pipeline: elicitation → planning → parallel scene generation → narration →
  assembly
- Dashboard shell with collapsible sidebar and central input
- Personal memory (session-to-session preference recall)
- Shared knowledge base with basic quality-based promotion

**Phase 2 — Near-term hardening**
- Schema memory layer: consistent vocabulary tagging across the shared corpus
- Adjudication layer: resolving contradictions between reference documents before they
  reach generation
- Production model sourcing decision (replacing free dev-tier NIM endpoints)

**Phase 3 — Platform expansion**
- Public API + SDK so third-party developers can integrate Visora's generation
  capability into their own products
- Usage-based billing, per-key rate limiting, multi-tenant isolation
- Bridging layer in the preference graph (non-obvious multi-hop preference discovery)
  and full parallel multi-agent corpus construction — gated on corpus/user-base scale,
  not built preemptively

---

## 10. Open questions / risks

- **Production model selection is unresolved.** Dev-mode models are free-tier NIM
  endpoints; several (notably the text embedding model) carry non-commercial licensing
  that must be resolved before any paid launch.
- **Cost model at scale is unvalidated.** Parallel scene generation means per-video
  cost scales with scene count × model calls; needs real usage data before pricing is
  set.
- **Retrieval quality at small corpus size is unproven.** The shared knowledge base's
  value compounds with scale — early users may see weaker retrieval than the system is
  ultimately capable of.
- **No user-facing editing beyond scene plan approval yet** — if users want more manual
  control (e.g. editing generated code directly), that's a product decision not yet
  made.

---

## 11. Appendix

- Full technical architecture: see companion architecture document
- Database schema: see `mova_schema_v2.sql` (table/column-level detail, RLS policies,
  triggers)
- Current model roster (dev): see `.env` model configuration
