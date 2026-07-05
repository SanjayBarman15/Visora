# Visora — Staged Implementation Prompts (Mock UI → Target Flow)

**Purpose:** Copy-paste-ready prompts for an AI coding assistant (Cursor, Claude
Code) to incrementally refactor the current mock UI into the flow specified in
APP_FLOW.md v2. Run stages in order. Each stage should leave the app in a working,
demoable state — do not start a stage until the previous one's acceptance criteria
pass.

**Current state going in** (for the assistant's context, not to be pasted verbatim):
- Empty state (grid background, centered input, sidebar with project list) already
  closely matches the target and needs minimal change.
- Scene Plan Review is currently a separate full-page view with its own two-column
  layout (a narrow "Coordinating with Scout" chat rail + a main scene-card list),
  reached via routing/state change away from the chat.
- Post-generation "Workspace Stage" already has a three-panel-like shape (chat left,
  preview center, code inspector right) but the code panel is expanded by default
  (target: collapsed by default) and has a real rendering bug — the syntax
  highlighter's output is showing raw class-name strings as visible text instead of
  applying them as styling.
- Grid background currently persists into the Scene Plan Review screen; target
  behavior is solid background once any conversation is active.

**Ground rules for every stage:**
- Do not exceed ~400 lines in any single page/component file — extract subcomponents
  proactively rather than letting a file grow past that.
- Use the existing zustand + shadcn/ui + sonner stack; do not introduce a new state
  library, component library, or toast system.
- Each stage must leave existing functionality working — this is an incremental
  refactor, not a rewrite. If a stage requires temporarily keeping old and new code
  paths side by side behind a flag, do that rather than a risky big-bang swap.

---

## Stage 1 — Centralize state in a single zustand store

**Goal:** Move state currently scattered across components (mock data, local
component state) into one zustand store, with zero visible/behavioral change to the
UI. This is a pure plumbing stage — if anything looks different after this stage,
something went wrong.

**Prompt:**
```
Locate the current state management for the Visora dashboard mock (project list,
active project, chat messages, scene plan data, sidebar collapsed state — wherever
these currently live, likely local component state or hardcoded mock arrays).

Create a single zustand store (e.g. `stores/useVisoraStore.ts`) that owns:
- sidebarCollapsed: boolean, and a toggleSidebar() action
- projects: array of { id, title, createdAt, status } — status is one of
  'draft' | 'eliciting' | 'plan_review' | 'generating' | 'assembling' | 'done' |
  'done_with_warnings'
- activeProjectId: string | null
- messages: array of { id, projectId, role: 'user' | 'assistant', content,
  timestamp } — keep this flat and filter by projectId when rendering, don't nest
  per-project
- scenePlans: keyed by projectId, each an array of { id, order, title,
  description, durationSeconds }
- actions: setActiveProject(id), addMessage(projectId, message),
  updateProjectStatus(id, status), reorderScenes(projectId, fromIndex, toIndex),
  updateScene(projectId, sceneId, changes), deleteScene(projectId, sceneId)

Refactor every existing component that currently reads/writes this data locally to
read/write through this store instead. Do not change any JSX layout, styling, or
component structure in this stage — this is a data-layer move only.

Add the sonner <Toaster /> component to the root layout if it isn't already present,
but do not fire any toasts yet — that's a later stage.

Acceptance criteria: the app looks and behaves identically to before this stage.
Every screen (empty state, scene plan review, workspace stage) still works exactly
as it did, just backed by the new store instead of scattered local state.
```

---

## Stage 2 — Background swap tied to conversation state

**Goal:** Grid background only shows on the true empty state; every other state gets
a solid background (black in dark mode, white in light mode).

**Prompt:**
```
In the zustand store from Stage 1, add a derived value or selector `isChatActive`
that's true whenever the active project's status is anything other than a fresh,
message-less draft (i.e. true as soon as the first message exists for a project).

Find the layout component(s) responsible for rendering the grid background (visible
on the empty state and currently also visible on the Scene Plan Review screen).
Make the grid conditional on `!isChatActive`, and render a solid background
(respecting the existing dark/light theme toggle) whenever `isChatActive` is true.

This should be a CSS/conditional-render change only — do not touch the scene plan
review layout structure itself yet, just its background. The bug where the grid
incorrectly persists into the Scene Plan Review screen should be fixed as a direct
result of this change.

Acceptance criteria: submitting the first prompt from the empty state immediately
swaps the background to solid, and it stays solid through scene plan review and the
workspace stage. The empty state still shows the grid when no project is active.
```

---

## Stage 3 — Move Scene Plan Review into the chat as an in-conversation card

**Goal:** The biggest structural change in this set. Scene plan review stops being a
separate full-page view and becomes a message rendered inline in the conversation.

**Prompt:**
```
Currently, Scene Plan Review is a separate full-page/full-width view with its own
two-column layout (a narrow chat rail on the left, a main area with scene cards and
an "Approve & Start Generation" button on the right).

Refactor this so the chat rail becomes the ONE and ONLY conversation view — full
width, standard chat layout (scrollable message list, composer fixed at the
bottom) — and the scene plan itself becomes a new message type rendered inline in
that same message list, not a separate page.

1. Add a new message variant to the store's `messages` type: alongside
   'user' | 'assistant', add a 'scene_plan' role (or a `type: 'scene_plan'` field
   on an assistant message) that carries the scene plan data for that message.

2. Create `components/chat/ScenePlanCard.tsx` — extract the existing scene-card
   list UI (title, description, duration, reorder up/down, delete button) from the
   current Scene Plan Review page into this component, but constrain its width to
   match a normal chat message bubble rather than spanning the full main area.

3. Add a narration toggle to ScenePlanCard using shadcn's Switch component, labeled
   something like "Include AI narration". Store this as `narrationEnabled: boolean`
   per project in the zustand store, defaulting to true.

4. Keep the "Approve & Start Generation" button, now inside ScenePlanCard. On click:
   - Call a new store action `approveScenePlan(projectId)` that transitions that
     project's status to 'generating'
   - Fire a sonner success toast: "Plan approved — generation started"

5. Remove the separate secondary "Suggest adjustments to the plan..." input bar —
   the single chat composer at the bottom is now the only input point, whether the
   user is talking to Scout during elicitation or requesting plan changes.

6. Do NOT delete the old standalone Scene Plan Review page/route yet — just stop
   navigating to it. Leave it in place but unreferenced, so this stage is easy to
   roll back if something's wrong. It gets deleted in Stage 8.

Acceptance criteria: after elicitation, the scene plan appears as a card inside the
same scrolling chat the user has been talking in — there is no page transition, no
separate layout. The narration toggle is visible and its state persists in the
store. Approving fires a toast and transitions status to 'generating'.
```

---

## Stage 4 — Unify empty state and chat view into one component

**Goal:** Clean up the seam between "no conversation yet" and "conversation in
progress" so it's one component swapping modes, not two separately-maintained ones.

**Prompt:**
```
Create (or refactor into) a single `components/chat/ChatView.tsx` that renders in
one of two modes based on whether the active project has any messages yet:

- Empty mode: centered layout — the "What are we visualising today?" heading,
  large textarea, suggested prompt template chips, submit button. (This is the
  current empty-state UI — move it here rather than duplicating it.)
- Conversation mode: standard chat layout — scrollable message list (using a
  `MessageRenderer` component, see below) with the composer fixed at the bottom.

Create `components/chat/MessageRenderer.tsx` that takes a message and switches on
its role/type: 'user' → simple bubble, 'assistant' → simple bubble,
'scene_plan' → renders the `ScenePlanCard` from Stage 3. Keep this component small
and dumb — it should not contain business logic, only rendering logic per type.

Submitting the empty-mode textarea should: create a new project in the store with
status 'draft', add the submitted text as the first user message, and switch that
project into conversation mode — this should feel instant, not a route change.

Acceptance criteria: there is one component responsible for both the empty state
and the chat, not two separately implemented screens. The transition from typing a
first prompt to seeing the conversation view happens without a jarring reload or
visible remount flicker.
```

---

## Stage 5 — Default-collapse the code panel and fix the syntax highlighting bug

**Goal:** Fix a real bug (broken syntax highlighting) and correct the code panel's
default state to match spec (collapsed by default).

**Prompt:**
```
In the Workspace Stage component (the three-panel post-generation view), the right
panel — "Manim Code Inspector" — currently:
(a) is expanded by default, but should be collapsed by default, and
(b) has a rendering bug: the syntax-highlighted code is showing raw output like
    `"text-pink-400 font-bold">class IntroArea(>Scene):` instead of properly
    colored code. This means the highlighter is generating HTML/class-name output
    that's being rendered as plain text rather than being parsed as markup.

Fix both:

1. Add `codePanelCollapsed: boolean` to the zustand store, defaulting to `true`.
   Add a toggle control (a chevron button in the panel's header) that flips this
   state. When collapsed, the panel should shrink to a slim closed state, not
   disappear entirely — it should still be obviously clickable to reopen.

2. Fix the highlighting bug. Identify how code is currently being highlighted —
   if it's a custom highlighter returning an HTML string, make sure that string is
   rendered as HTML (not injected as a plain text node). If a proper syntax
   highlighting library is easily available in the existing dependencies, prefer
   switching to it over patching a custom highlighter. Verify the fix by opening
   the code panel on a real generated scene and confirming: real color-coded
   syntax, no visible class-name strings, no stray `>` characters, correct line
   numbers.

3. While in this file, check whether the "Refinement Chat" panel here is a
   separate implementation from the `ChatView`/`MessageRenderer` built in Stage 4.
   If it is, refactor it to reuse the same chat components instead of maintaining
   a second, slightly different chat implementation. This keeps future chat
   changes from needing to be made twice.

Acceptance criteria: entering the workspace stage shows the code panel collapsed
by default; opening it shows correctly highlighted, readable Manim code; the chat
panel on the left is confirmed to be the same shared component from Stage 4, not a
duplicate.
```

---

## Stage 6 — Narration wiring and post-generation editing actions

**Goal:** Make the narration toggle from Stage 3 actually affect generation, and add
the per-scene / audio-only editing actions specified in APP_FLOW.md §11.

**Prompt:**
```
1. Wire the `narrationEnabled` flag (set in Stage 3's ScenePlanCard) into whatever
   function/API call kicks off generation, so it's actually passed through rather
   than only existing in the UI. If the generation call is currently mocked, make
   sure the mock reads and respects this flag (e.g. skips rendering an audio
   waveform/track in the mock preview when false).

2. In the Workspace Stage, add these actions, each as a small button/menu near the
   relevant scene or in the panel header:
   - "Regenerate this scene" — per scene, distinct from the existing "Regenerate
     Entire Video" button. Calls a new store action `regenerateScene(projectId,
     sceneId)` that sets only that scene back to a generating-equivalent status.
   - "Audio-only adjustment" — visible once project status is 'done' or
     'done_with_warnings'. Calls a new store action `adjustAudioOnly(projectId,
     changes)` that does NOT touch scene status at all, simulating the fast
     re-mix path from APP_FLOW.md §11.

3. Wrap all three actions (regenerate entire, regenerate scene, audio-only
   adjustment) with sonner toast feedback: an info/loading toast when triggered,
   updated to a success toast on completion (or error toast on failure — even if
   failure is simulated for now, the code path should exist).

Acceptance criteria: toggling narration off before approving noticeably changes
the resulting mock preview/output. Each of the three post-generation actions is
individually clickable, calls its own distinct store action, and produces visible
toast feedback for its lifecycle.
```

---

## Stage 7 — Mid-generation plan-change guard

**Goal:** Implement the "never apply a plan change silently while generating" rule
from APP_FLOW.md §10.1 / §14.

**Prompt:**
```
When a project's status is 'generating' and the user sends a new message in the
chat composer, the app currently just appends it as a normal message. Change this:

1. Add a lightweight check when a message is submitted while status is
   'generating': if it looks like a plan-change request (for a first pass, this can
   be a simple heuristic — e.g. checking status === 'generating' is enough to
   always show the guard, rather than trying to classify intent perfectly) —
   do not send it as a normal message yet.

2. Instead, show an inline confirmation UI (use shadcn's AlertDialog or a small
   two-button inline prompt within the chat) with two explicit options:
   - "Wait" — queue the message to be sent normally once status leaves
     'generating' (store it in a `pendingRevisions` array on the project, applied
     once generation completes)
   - "Cancel & revise now" — call a new store action `cancelGenerationAndRevise
     (projectId)` that rolls status back to 'plan_review' and re-sends the user's
     message as a normal chat message so Scout/Orion can act on it immediately

3. Add sonner toast feedback for both paths — e.g. "Got it, we'll apply this once
   the current generation finishes" for Wait, and "Generation cancelled — updating
   your plan" for Cancel & revise now.

Acceptance criteria: sending a message while a project is 'generating' never
silently does anything — the user is always shown the two-option choice first, and
picking either one produces a visible toast and the correct resulting state.
```

---

## Stage 8 — Cleanup pass: line-count audit and dead code removal

**Goal:** Final polish stage — enforce the file-size constraint and remove
everything made obsolete by earlier stages.

**Prompt:**
```
1. Check every page/component touched across Stages 1–7 for line count. Any file
   over ~400 lines should be split into smaller subcomponents (this most likely
   applies to the Workspace Stage component and possibly ChatView). Extract
   cleanly-named subcomponents rather than just breaking files arbitrarily.

2. Delete the standalone Scene Plan Review page/route that was left in place but
   unused after Stage 3, along with any now-unreferenced imports, styles, or mock
   data associated only with that old page.

3. Do a final pass confirming:
   - No grid background appears anywhere except the true empty state
   - The code inspector panel defaults to collapsed and displays correctly
     highlighted code when opened
   - Every state-changing action (approve plan, regenerate scene, regenerate
     entire video, audio-only adjustment, cancel & revise) produces a sonner toast
   - No component exceeds ~400 lines

Report back a short summary of what was deleted and which files were split, so the
change is easy to review.
```

---

## Suggested usage

Run Stage 1 first and confirm the app is visually unchanged before moving on — this
is the stage most likely to silently break something if rushed. Stages 2–4 build the
core flow change and should be done in order since each depends on the previous
one's store additions. Stages 5–7 are more independent of each other and can be
reordered if one is more urgent than another. Stage 8 should always run last.