# Visora — App Flow

**Status:** Draft
**Companion docs:** PRD.md (why), TRD.md (how it's built)
**Purpose:** Screen-by-screen walkthrough of every user-facing state and transition.

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
| Direct dashboard URL, logged in | Dashboard — Empty State or Active Project, depending on session |

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
- On submit → transitions to **Elicitation** for a newly created project, and a new
  entry immediately appears at the top of the sidebar's project list with status
  "draft"

---

## 7. Elicitation (Scout)

- Main area switches from centered input to a standard chat layout: scrollable
  message list, composer fixed at the bottom
- The user's original prompt appears as the first message
- Scout responds conversationally, asking follow-up questions as needed (audience
  level, tone, depth, visual preferences)
  - **Returning user note:** if prior preferences exist, Scout's first response
    reflects them (e.g. doesn't ask about tone if the user has an established
    preference) rather than starting from a blank slate
  - If the user pastes a URL (GitHub repo, YouTube link, article), it's fetched and
    referenced automatically — no separate "attach" action needed
- Project status: `draft` → `eliciting`
- This loop continues until Scout has enough to produce a plan — no fixed number of
  turns; ends when required fields are filled, not on a timer
- Transition: once elicitation is complete, main area shows a brief transitional
  state ("Planning your video...") before moving to **Scene Plan Review**

---

## 8. Scene Plan Review (Orion)

- Displays the proposed scene breakdown as an ordered, editable list — each entry
  shows scene title, one-line description, and estimated duration
- Available actions per scene: reorder (drag), rename, edit description, delete
- Available action for the whole plan: approve and generate
- Project status: `eliciting` → `plan_review`
- No generation compute is spent while the user is on this screen — approval is a
  hard gate
- On approval → project status: `plan_review` → `generating`; transitions to
  **Generation / Live Status**
- If the user abandons this screen without approving, the project remains in
  `plan_review` and is resumable later from the sidebar — nothing is lost

---

## 9. Generation / Live Status

- Real-time view (via Server-Sent Events) showing per-scene progress:
  retrieving → generating → reviewing → fixing (if needed) → rendering → done
- Scenes render in parallel — the UI should reflect multiple scenes progressing
  simultaneously, not a single linear progress bar implying sequential work
- Narration and audio status shown as a separate parallel track alongside scene
  progress, not nested under any one scene
- If a scene exhausts its fix attempts, it's flagged (not hard-failed) — generation
  continues for other scenes, and the flagged scene is called out clearly once
  everything completes
- User can navigate away (to another project, or close the tab) — generation
  continues server-side; the project's sidebar status badge reflects progress even
  when this screen isn't open
- Project status: `generating` → `assembling` (once all scenes + narration are
  ready) → `done` (or `done_with_warnings` if any scene was flagged)

---

## 10. Completed video

- Final video player, front and center
- Video-level actions: download, regenerate a specific scene, adjust audio only
  (swap music, tweak narration) without touching visuals
- If `done_with_warnings`: an inline callout identifies exactly which scene(s) had
  issues and offers a one-click "regenerate this scene" action
- **Regenerate single scene** → that scene alone returns to the Generation view for
  just that scene; on completion, reassembly reuses cached clips for every other
  scene (no full re-render)
- **Audio-only adjustment** → skips the scene pipeline entirely, goes straight to a
  lightweight re-mix step, returns to this screen in seconds rather than minutes

---

## 11. Project history (sidebar navigation)

- Clicking any past project in the sidebar loads that project directly into whichever
  state it's actually in — a `plan_review` project resumes at plan review, not at the
  beginning of elicitation; a `done` project opens directly to its finished video
- Status badges in the list must stay accurate in real time — a project generating in
  the background should visibly update its badge without the user needing to click
  into it

---

## 12. Settings

- Accessible via the user menu at the sidebar's bottom
- Scope: account details, subscription tier, and a view of the preferences the system
  has learned (style, tone, audience level) with the ability to edit or clear them
  - This is the one place personal memory becomes visible and user-controllable —
    memory should never feel like an opaque black box the user can't inspect
- No project data lives here — this is account/preference scope only

---

## 13. Error & edge-case states

| Situation | What the user sees |
|---|---|
| Elicitation stalls (agent failure after retries) | Conversational error message in the chat itself ("Something went wrong — try rephrasing that"), not a generic toast |
| A scene permanently fails after max fix attempts | Flagged clearly at video completion (§10), never a silent gap in the final video |
| Guardian blocks unsafe input or output | Clear, non-judgmental message explaining the request can't be completed — no partial generation proceeds |
| User submits an empty or near-empty prompt | Submit button stays disabled; no round-trip to the backend for an obviously incomplete input |
| Network/session interruption mid-generation | On reconnect, the Live Status view resumes from actual server-side state — never shows stale or reset progress |
| User deletes a project mid-generation | In-flight tasks for that project are cancelled server-side; no orphaned Celery tasks continue writing to a deleted project |

---

## 14. State summary (project lifecycle)

```
draft → eliciting → plan_review → generating → assembling → done
                                                           ↳ done_with_warnings
```

Any state can branch to a scene-level regeneration loop from `done` /
`done_with_warnings` without changing the overall project state — a single-scene
fix is a sub-flow, not a full lifecycle restart.
