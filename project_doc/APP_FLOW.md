# Visora — App Flow

**Status:** Draft (v2 — chat-first flow + three-panel workspace)
**Companion docs:** PRD.md (why), TRD.md (how it's built)
**Purpose:** Screen-by-screen walkthrough of every user-facing state and transition.

**Changelog from v1:** Scene Plan Review is no longer a separate full-screen step —
it now happens inside the chat conversation itself, with a narration on/off toggle
added before generation. The old "Generation / Live Status" and "Completed video"
screens are replaced by a single three-panel workspace (chat + preview + collapsible
code inspector) that persists from the moment generation starts through final
delivery and all later edits.

**Changelog since v2 draft:** the three open items flagged in that draft are now
decided — see §15.

---

## 1. Overview

This document traces every path a user can take through Visora, from first landing
on the marketing page through generating and receiving a finished video. Each section
covers: what the user sees, what actions are available, and what happens next.

---

## 2. Entry points

| Entry point | Where it leads |
|---|---|
| Marketing landing page → "Try it" CTA | Sign up (new user) or Dashboard (returning, logged in) |
| Direct dashboard URL, not logged in | Redirect to login |
| Direct dashboard URL, logged in | Dashboard — Empty State or an existing project's chat/workspace, depending on session |

---

## 3. Landing page

- Hero establishes the core value prop (precise, code-driven animation from a prompt)
- Primary CTA: "Start creating" → sign up flow
- Secondary CTA: "See an example" → scrolls to or opens an example video, no auth
  required
- No dashboard functionality lives here — this page's only job is conversion

---

## 4. Auth (sign up / login)

- Sign up: email + password (or OAuth, if configured) → on success, creates a
  `profiles` row automatically (server-side trigger, no client action needed) → lands
  on **Dashboard — Empty State**
- Login: standard credential check → lands on **Dashboard**, resuming whichever
  project was last active, or Empty State if none exists
- No elicitation, memory, or project data exists yet for a brand-new user — the
  Empty State is genuinely empty, not pre-seeded

---

## 5. Dashboard shell (persistent across all in-app screens)

- **Left sidebar** (collapsible)
  - "New video" button — always visible, expanded or collapsed
  - Scrollable project list, each entry showing title + status badge (draft,
    planning, generating, done, failed)
  - Collapse toggle — persists across navigation within the session
  - User avatar + settings entry, pinned at the bottom
- **Main area** — content changes based on state below; sidebar itself never reloads

---

## 6. Dashboard — Empty State

- Centered, large input textarea: "Describe the video you want to create..."
- 3–4 example prompt chips beneath the input — clicking one populates the input,
  does not auto-submit
- Submit is disabled until there's input text
- **Background:** the grid background used on this Empty State (and the marketing
  page) is intentional here — it signals "start something new." It does not carry
  into the chat view (see §7).
- On submit → immediately transitions into the **Chat view** (§7) for a newly created
  project, and a new entry appears at the top of the sidebar's project list with
  status "draft"

---

## 7. Chat transition & layout

- The moment the first prompt is submitted, the interface switches from the centered
  empty-state layout to a standard AI-chatbot layout (ChatGPT/Claude-style):
  scrollable message list, composer fixed at the bottom
- **Background swap:** the grid background is replaced by a clean solid background —
  black in dark mode, white in light mode — the instant the chat view activates. The
  grid is an empty-state/landing signal only; it would be visually distracting during
  an actual conversation.
- The user's original prompt appears as the first message in this new layout
- All subsequent interaction — elicitation, scene plan review, narration
  configuration — happens inside this same chat, without further layout changes,
  until the user clicks **Process** (§9)

---

## 8. Elicitation (Scout)

- Scout responds conversationally within the chat, asking follow-up questions as
  needed (audience level, tone, depth, visual preferences)
  - **Returning user note:** if prior preferences exist, Scout's first response
    reflects them (e.g. doesn't ask about tone if the user has an established
    preference) rather than starting from a blank slate
  - If the user pastes a URL (GitHub repo, YouTube link, article), it's fetched and
    referenced automatically — no separate "attach" action needed
- Project status: `draft` → `eliciting`
- This loop continues until Scout has enough to produce a plan — no fixed number of
  turns; ends when required fields are filled, not on a timer

---

## 9. Scene plan & narration setup (in-chat)

- Once elicitation is complete, the proposed scene plan renders **as a message
  within the chat itself** — not a separate screen. Each scene shows title,
  description, and estimated duration.
- The user can request changes conversationally ("combine scenes 2 and 3," "make the
  intro shorter") — Scout/Orion update the in-chat plan message in place rather than
  opening a separate editor
- **Narration toggle:** presented alongside the plan, before generation — the user
  turns AI-generated narration/audio on or off for the final video at this stage.
  This isn't the only chance to change it, though — see §10.2 and §11: Narrator's
  script is timed against the *planned* scene durations, available immediately after
  the plan exists, so the toggle stays changeable for as long as status is
  `generating` (before final assembly starts). After the video reaches `done`,
  turning narration on or off is just an audio-only adjustment (§11), not a separate
  mechanism.
- A **Process** button is shown once a plan exists — this is the hard gate: no
  generation compute is spent until the user clicks it
- Project status: `eliciting` → `plan_review` while the plan is under discussion
- If the user leaves without clicking Process, the project stays in `plan_review` and
  is resumable later from the sidebar, picking the conversation back up exactly where
  it left off
- On clicking Process → project status: `plan_review` → `generating`; the interface
  transitions into the **three-panel workspace** (§10)

---

## 10. Three-panel workspace

This single workspace covers everything from the start of generation through final
delivery and all later edits — there is no separate "done" screen; the workspace
simply updates in place as state changes.

**Layout:**

```
┌───────────────┬─────────────────────────────┬───────────────────┐
│   Chat panel  │      Preview panel          │   Code panel      │
│   (left)      │      (center)               │   (right,         │
│               │                              │   collapsed       │
│  persists,    │  video preview + status      │   by default)     │
│  stays live   │  render status indicator     │                    │
│               │  timeline/scrubber           │  tabbed source     │
│               │                              │  files per scene   │
└───────────────┴─────────────────────────────┴───────────────────┘
```

### 10.1 Left panel — chat (persistent)
- The same conversation from elicitation and plan review remains fully visible and
  interactive — the user can keep talking to the AI without leaving the workspace
- Requests made here ("make the node connections pulse blue") can target specific
  scenes; the assistant's reply includes an explicit action (e.g. "Apply to Scene 2")
  rather than applying changes silently
- This panel does not disappear or get replaced at any point after Process is clicked
- **Plan-level change requests while status is `generating`** (e.g. "actually, add a
  scene about X") are never applied silently — an in-flight generation must not be
  interrupted without the user knowing. The assistant always presents two explicit
  options instead:
  - **Wait** — finish the current generation, then apply the change as a new
    revision
  - **Cancel & revise now** — cancel in-flight scene tasks for this project
    server-side, roll status back to `plan_review`, apply the change, and the user
    clicks Process again
  This mirrors the existing rule for project deletion (§14): in-flight tasks are
  always cancelled cleanly, never left orphaned, and the user is always told which
  is happening.

### 10.2 Center panel — preview
- Shows the render status (e.g. "Rendering," resolution/fps) while generation is in
  progress, and the finished video player once ready
- Scene generation happens in parallel server-side; the status indicator here should
  reflect real aggregate progress, not a single linear bar implying sequential work
- Includes a timeline/scrubber once a preview exists, with named segments
  corresponding to distinct animation actions within a scene (not just scene
  boundaries) — mirroring the level of granularity in the reference workspace layout
- If narration was enabled, playback includes audio; if disabled, the preview is
  silent by design, not a missing feature
- A visible action here (e.g. "Regenerate Entire Video") is always available as an
  escape hatch, separate from the more targeted single-scene regeneration described
  in §11

### 10.3 Right panel — code inspector (collapsed by default)
- Collapsed on entry into the workspace — most users won't need it immediately
- Expands to show tabbed source files, one per scene plus any shared config, with
  syntax-highlighted Manim code
- Read access is available as soon as a scene's code exists, even before that scene
  finishes rendering — the user shouldn't have to wait for the full video to inspect
  what's being generated
- **Read-only in v1, by decision, not by omission.** Direct code edits would bypass
  the review/dry-run validation every agent-generated scene goes through — allowing
  them means either silently losing that guarantee or building a full re-validation
  UX just for manual edits. Instead, "change this" always routes back through the
  chat panel (§10.1) — e.g. "make the axes red instead of blue" — which keeps every
  change inside the same validated pipeline. Editable code is a plausible power-user
  feature later, but only gated behind that same validation, never bypassing it.

---

## 11. Post-generation editing (within the workspace)

- **Regenerate a single scene:** available per scene (e.g. from the code panel or a
  per-scene control in the preview area) — only that scene returns to a generating
  state; on completion, reassembly reuses cached clips for every other scene
- **Audio-only adjustment:** swapping music or tweaking narration skips the scene
  pipeline entirely and goes straight to a lightweight re-mix step
- **Regenerate entire video:** available as a deliberate, explicit action (§10.2) —
  distinct from a single-scene fix, and should be presented as a heavier action, not
  a default suggestion
- If any scene was flagged after exhausting its fix attempts during generation, that
  scene is called out clearly in the preview panel with a direct regenerate action —
  never a silent gap in the final video
- Project status: `generating` → `assembling` → `done` (or `done_with_warnings` if
  any scene was flagged)

---

## 12. Project history (sidebar navigation)

- Clicking any past project in the sidebar loads it directly into whichever state
  it's actually in:
  - `draft` / `eliciting` / `plan_review` → resumes in the **chat view** (§7–§9),
    conversation intact
  - `generating` / `assembling` / `done` / `done_with_warnings` → opens directly into
    the **three-panel workspace** (§10), not the chat view alone
- Status badges in the list must stay accurate in real time — a project generating
  in the background should visibly update its badge without the user needing to
  click into it

---

## 13. Settings

- Accessible via the user menu at the sidebar's bottom
- Scope: account details, subscription tier, and a view of the preferences the
  system has learned (style, tone, audience level) with the ability to edit or clear
  them
  - This is the one place personal memory becomes visible and user-controllable —
    memory should never feel like an opaque black box the user can't inspect
- No project data lives here — this is account/preference scope only

---

## 14. Error & edge-case states

| Situation | What the user sees |
|---|---|
| Elicitation stalls (agent failure after retries) | Conversational error message in the chat itself ("Something went wrong — try rephrasing that"), not a generic toast |
| A scene permanently fails after max fix attempts | Flagged clearly in the workspace's preview panel (§11), never a silent gap in the final video |
| Guardian blocks unsafe input or output | Clear, non-judgmental message in the chat explaining the request can't be completed — no partial generation proceeds |
| User submits an empty or near-empty prompt | Submit button stays disabled; no round-trip to the backend for an obviously incomplete input |
| Network/session interruption mid-generation | On reconnect, the workspace resumes from actual server-side state — never shows stale or reset progress |
| User deletes a project mid-generation | In-flight tasks for that project are cancelled server-side; no orphaned Celery tasks continue writing to a deleted project |
| User requests a plan change from the workspace chat while status is `generating` | Assistant presents an explicit choice — wait for current generation to finish, or cancel in-flight tasks and revise now (§10.1) — never applies the change silently |

---

## 15. Decisions resolved since v2 draft

Three items originally flagged as open in this flow have been decided and folded
into the sections above:

- **Code panel is read-only in v1** (§10.3) — changes route through chat, not direct
  edits, to preserve the validation guarantee on every scene.
- **Mid-generation plan changes are never silent** (§10.1, §14) — the user always
  gets an explicit wait-or-cancel choice.
- **Narration is toggleable through all of `generating`, not just before Process**
  (§9), and becomes an audio-only adjustment (§11) once the video is `done`.

---

## 16. State summary (project lifecycle)

```
draft → eliciting → plan_review → generating → assembling → done
                                                           ↳ done_with_warnings
```

UI presentation mapping:
- `draft`, `eliciting`, `plan_review` → **Chat view** (§7–§9)
- `generating`, `assembling`, `done`, `done_with_warnings` → **Three-panel workspace**
  (§10)

Any state from `done` onward can branch into a scene-level regeneration loop (§11)
without changing the overall project status back — a single-scene fix is a sub-flow,
not a full lifecycle restart.