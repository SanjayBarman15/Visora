# Visora — Project Page Flow & Studio Layout

> This document explains what was built, why it was built that way, and how all the pieces connect together.

---

## The Big Picture

Before this change, everything lived on `/dashboard` as a single stateless chat. There was no concept of a "project" on the frontend — the Zustand store held all state in memory and was wiped on refresh.

After this change, Visora works like a proper product:

```
/dashboard               ← Start something new
    ↓ (first message)
/project/[id]            ← Your project lives here
    ↓ (chat → plan → approve)
3-Panel Studio            ← Left: History | Mid: Video | Right: Code
```

Every project gets a real row in Supabase. Every session is tracked. The store knows which project it belongs to.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE (DB)                        │
│  projects table  ←→  sessions table  ←→  profiles table    │
└──────────────────────────┬──────────────────────────────────┘
                           │ (browser client — lib/projects.ts)
┌──────────────────────────▼──────────────────────────────────┐
│               store/useVisoraStore.ts                       │
│  projectId | sessionId | messages | scenePlan | forgeCode   │
│  initProject() | resetStore() | sendMessage()               │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
┌──────────▼──────────┐      ┌────────────▼──────────────────┐
│  /dashboard         │      │  /project/[id]                │
│  DashboardInput     │      │  ProjectClient → ProjectView  │
│  (start new)        │      │  ChatMode or StudioMode       │
└─────────────────────┘      └───────────────────────────────┘
```

---

## File-by-File Breakdown

### 1. `lib/projects.ts` — The Data Layer

Handles all Supabase operations for projects and sessions. The frontend talks directly to Supabase using the browser client — no backend changes needed.

**Key functions:**

```ts
createProject(userId, firstMessage)
// → Inserts into `projects` table (title derived from first message, max 80 chars)
// → Inserts into `sessions` table linked to the project
// → Returns { projectId, sessionId }

getProject(projectId, userId)
// → Fetches a project, validates ownership (user_id must match)
// → Returns null if not found (triggers redirect to /dashboard)

getUserProjects(userId)
// → Future use: fetch all projects for a sidebar/history list
```

**Why direct Supabase?** The backend API (`localhost:8000`) does not yet support `project_id` / `session_id`. Instead of blocking on backend changes, the frontend writes project metadata directly to Supabase. When the backend catches up, two commented lines in the store get uncommented — that is the only change needed.

---

### 2. `store/useVisoraStore.ts` — The Central State

The store went from being a "stateless chat memory" to being **project-aware**.

**New state fields:**
```ts
projectId: string | null   // Which project is currently open
sessionId: string | null   // Current session ID (links to sessions table)
```

**New actions:**
```ts
initProject(projectId, sessionId)
// Called once when the project page loads — seeds the store with project context

resetStore()
// Called when user clicks "New Project" — wipes all state back to defaults
```

**API calls are unchanged.** `sendMessage`, `generateScenePlan`, and `generateCode` still hit the same `localhost:8000` endpoints with the same payloads. Comments mark where `project_id` / `session_id` will be added later:

```ts
// Future: add project_id and session_id here when backend supports it
// project_id: get().projectId,
// session_id: get().sessionId,
```

---

### 3. `components/dashboard-input.tsx` — The Starting Point

Replaces the old `ChatContainer` on the dashboard. This is the pure "start something" UI — input box and suggestion chips only.

**The flow when user hits send:**
1. Calls `createProject(userId, text)` — Supabase creates the project + session rows
2. Calls `initProject(projectId, sessionId)` — seeds the Zustand store
3. Calls `router.push('/project/{id}?firstMessage={text}')` — navigates to the project page

The first message is passed as a URL query param so the project page can fire it automatically on arrival. The project must exist in Supabase *before* navigating so the server-side ownership check can validate it.

---

### 4. `app/dashboard/page.tsx` — Dashboard Page

`ChatContainer` removed. Now only renders `DashboardInput`. The dashboard is a clean landing page. All conversation happens on `/project/[id]`.

---

### 5. `app/project/[id]/page.tsx` — Project Page (Server Component)

Runs on the server. Three jobs:
1. Checks auth — redirects to `/login` if not logged in
2. Fetches the project from Supabase, validates `user_id` matches — redirects to `/dashboard` if invalid/not found
3. Passes clean props to the client component

Auth and DB ownership checks never happen in the browser.

---

### 6. `app/project/[id]/project-client.tsx` — Project Page (Client Component)

The client-side orchestrator for the project page.

**Store initialization:**
```ts
useEffect(() => {
  if (storedProjectId !== projectId) {
    initProject(projectId, crypto.randomUUID())
  }
}, [projectId])
```
If the store already has this project (user navigated from dashboard), nothing happens. If the user refreshed the page, it re-initializes with a fresh session ID.

**First message dispatch:**
```ts
useEffect(() => {
  const firstMessage = searchParams.get('firstMessage')
  if (firstMessage && !firstMessageSent.current) {
    firstMessageSent.current = true
    setTimeout(() => sendMessage(firstMessage), 100)
  }
}, [searchParams])
```
The first message passed from the dashboard as a URL query param is picked up here and fired automatically. `firstMessageSent.current` is a `useRef` (not state) so it cannot fire twice and does not trigger re-renders.

---

### 7. `components/project-view.tsx` — The Mode Switcher

Reads `forgeCode` from the store and decides which UI to show:

```ts
const isStudioMode = !!forgeCode
return isStudioMode ? <StudioLayout /> : <ChatContainer />
```

The transition from chat mode to studio mode happens automatically when `generateCode()` completes and sets `forgeCode` in the store. No manual trigger needed.

It also owns the project page navbar — project title in the center, "New Project" on the left (resets store + routes to `/dashboard`), plan badge + avatar on the right.

---

### 8. `components/studio/studio-layout.tsx` — The 3-Panel Wrapper

Simple flex layout holding the 3 panels:

```
┌──────────────┬──────────────────────────┬──────────────────┐
│  ChatPanel   │       VideoPanel          │    CodePanel     │
│   300px      │        flex-1             │     420px        │
└──────────────┴──────────────────────────┴──────────────────┘
```

- **Left (300px):** Fixed — chat history
- **Middle (flex-1):** Takes all remaining space — the hero panel
- **Right (420px):** Fixed — wide enough for code

The whole layout animates in with `fade-in slide-in-from-bottom-2` when it first renders.

---

### 9. `components/studio/chat-panel.tsx` — Left Panel

Read-only, scrollable replay of the full conversation history. Messages are rendered in the same bubble style as the chat but at a smaller scale. The approved scene plan is shown at the bottom in a locked state — green border, checkmark icon, muted text. A "New Project" button at the bottom calls `resetStore()` and routes to `/dashboard`.

---

### 10. `components/studio/video-panel.tsx` — Middle Panel (Hero)

Shows the rendered animation output — or a premium placeholder when there is nothing yet.

**If `videoUrl` is set:** Renders a `<video>` element with browser controls.

**If no video yet (current state):** Shows a premium placeholder with animated pulsing rings (`animate-ping` with different durations), a film reel icon, descriptive copy, and a disabled "Render Scene" button ready to be wired up when the render pipeline exists.

---

### 11. `components/studio/code-panel.tsx` — Right Panel

A proper code viewer — not a chat bubble.

- **Line numbers** — separate column styled like an IDE gutter
- **Filename header** — shows `SceneClassName.py` from `forgeCode.scene_class_name`
- **Copy button** — copies raw code to clipboard with toast notification
- **Download button** — triggers browser download of the `.py` file
- **Regenerate button** — calls `generateCode()` again for a fresh version

---

## End-to-End Flow

```
1. User opens /dashboard
   └── DashboardInput: greeting + input box + suggestions

2. User types a prompt and sends
   └── createProject() → Supabase: projects row + sessions row created
   └── initProject() → store seeded with projectId + sessionId
   └── Navigate to /project/{id}?firstMessage={text}

3. /project/[id] loads
   └── Server: validates auth + project ownership
   └── ProjectClient mounts → initProject() if needed
   └── sendMessage(firstMessage) fires automatically from query param

4. Chat mode — Orion collects requirements
   └── Messages stream in the chat UI
   └── Requirements bar fills in as fields are populated
   └── requirements.is_complete = true → "Generate Scene Plan" appears

5. User generates and approves the scene plan
   └── generateScenePlan() → scenePlan set in store
   └── ScenePlanCard shown in chat with "Approve" button
   └── User clicks Approve → generateCode() fires
   └── forgeCode set in store

6. Studio mode activates
   └── isStudioMode = true in ProjectView
   └── StudioLayout animates in
       ├── Left: ChatPanel — full history + locked approved plan
       ├── Mid:  VideoPanel — placeholder with animated rings
       └── Right: CodePanel — line-numbered code + Copy/Download/Regenerate
```

---

## Future Work — Where to Wire Things

| Feature | File to change |
|---|---|
| Send `project_id` to backend API | Uncomment 3 lines in `useVisoraStore.ts` |
| Real render output video | `VideoPanel` — replace placeholder with `<video src={clipUrl}>` |
| Projects history sidebar | Use `getUserProjects()` from `lib/projects.ts` |
| Editable project title | Add inline edit to navbar in `project-view.tsx` |
| Multiple scenes / tabs | Extend `CodePanel` to show tabs per `scene_checkpoint` |
| Voiceover panel | New studio panel or tab in `studio-layout.tsx` |
