# Session Change Log

Everything added or modified in this session: the backend README and a full realtime frontend for Collaboard. Written as a reference for what exists now and why it's shaped the way it is.

## 1. Backend documentation — `README.md`

Created the project's first README (previously none existed). Covers tech stack, feature list, module layout (routes → controller → service pattern), the `Board → Column → Task` data model, setup steps (Docker Postgres, `.env`, Prisma migrate), npm scripts, the full REST API surface, and the full Socket.IO event contract (client→server and server→client tables).

Later amended with a one-line pointer to [`frontend/README.md`](frontend/README.md) once the frontend existed.

*(Note: the README, and the pre-existing `task:move` socket feature, are now committed as `4326661` and `6359dd9` in git history — those commits weren't run by me in this session, just for context on what's already on `main`.)*

## 2. New frontend application — `frontend/`

A complete React + TypeScript client, built from scratch, in its own `frontend/` directory with its own `package.json`/`node_modules` (not a monorepo tool — just a sibling project). Not built as a Claude Artifact, because it needs a real persistent WebSocket connection to a localhost backend, which the Artifact sandbox blocks.

### Why a real app instead of a mockup

The brief was "make a frontend for this app" — the app already has a working REST + Socket.IO backend, so the frontend had to be a real client wired to that contract, not a static design.

### Stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | Vite 6 | Fast dev server, minimal config |
| Framework | React 18 + TypeScript | Matches backend's TS-first codebase |
| Realtime | `socket.io-client` | Matches server's `socket.io` version/protocol |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Actively maintained (unlike `react-beautiful-dnd`), supports multi-container drag |
| Styling | Hand-written CSS + custom property tokens | No UI framework — kept full control for a bespoke visual identity rather than a generic component-kit look |
| Fonts | `@fontsource/*` (self-hosted, no CDN) | Space Grotesk, IBM Plex Sans, IBM Plex Mono |
| Routing | ~15-line hand-rolled hook (`useRoute.ts`) | Only two routes (`/` and `/board/:id`); a full router was unjustified |

### Design direction

A "night dispatch desk" identity, chosen deliberately to avoid the generic AI-tool defaults (cream+serif+terracotta, near-black+neon accent, uniform soft-shadow SaaS cards):

- **Palette** (`src/styles/tokens.css`): ink-navy background (`--ink #0f1420`), panel/column surfaces (`--panel #171e2e`), paper-cream task cards (`--paper #f3efe6`), brass accent (`--brass #d9a24b`) reserved specifically for *live* states — the pulsing "connected" dot, the online status chip — so the accent color always signals "this is happening right now," plus a moss green for the Done column and rust for errors/delete.
- **Type**: Space Grotesk for headings/UI chrome, IBM Plex Sans for body text, IBM Plex Mono used only for real data (task position numbers), never as decoration.
- **Cards**: hard offset shadows (`3px 3px 0 rgba(0,0,0,.28)`) instead of blurred SaaS-style shadows, a dashed divider above the footer evoking a torn ticket stub — a deliberate, single recurring motif rather than decoration applied everywhere.

### File-by-file breakdown

```
frontend/
├── index.html, vite.config.ts, tsconfig.json    — Vite/TS project setup
├── .env / .env.example                          — VITE_API_URL (defaults to http://localhost:3000)
├── README.md                                     — frontend-specific setup + architecture notes
└── src/
    ├── main.tsx                                  — React root, imports global.css
    ├── App.tsx                                   — 2-route switch (Home vs Board) via useRoute
    ├── types.ts                                  — Board/Column/Task/Presence types mirroring the Prisma schema
    ├── vite-env.d.ts                              — Vite client type reference
    ├── lib/
    │   ├── api.ts                                — fetch wrapper: createBoard, getBoard, typed ApiError
    │   └── socket.ts                             — lazy singleton socket.io-client instance
    ├── hooks/
    │   ├── useRoute.ts                           — minimal pushState-based router
    │   ├── useLocalStorage.ts                    — persists the user's display name across visits
    │   └── useBoardSocket.ts                     — the realtime core (see below)
    ├── pages/
    │   ├── Home.tsx / Home.css                   — name entry + create-board / join-board forms
    │   └── Board.tsx / Board.css                 — board shell, DndContext, header, drag handlers
    ├── components/
    │   ├── ColumnLane.tsx / .css                 — one column: droppable + sortable list + quick-add
    │   ├── TaskCard.tsx / .css                   — sortable task card with edit/delete menu
    │   ├── TaskCardOverlay.tsx                   — non-sortable static clone used only in DragOverlay
    │   ├── QuickAddTask.tsx                      — inline "+ Add task" form, no modal
    │   └── TaskModal.tsx / .css                  — edit-task dialog (title + description)
    └── styles/
        ├── tokens.css                            — design tokens (color, type, spacing, radius)
        └── global.css                            — resets, font imports, shared button/field primitives
```

### How realtime state works (`useBoardSocket.ts`)

This is the part most worth understanding if you touch the code later:

1. On mount, connects the socket and emits `join-board`.
2. All task mutations (create/update/delete/move) are sent as **socket emits**, never REST calls — this keeps the creator's own UI in sync via the same broadcast every other client gets, rather than special-casing "my own change."
3. On **every** incoming `task:created` / `task:updated` / `task:deleted` / `task:moved` event, the client **refetches the whole board** via `GET /api/boards/:id` rather than patching the local array by hand.

   This was a deliberate choice, not laziness: the backend's `moveTask` (in `task.service.ts`) shifts the `position` of *sibling* tasks in the database as part of a move, but `board.socket.ts` only broadcasts the single moved task via `task:moved`. A client that patched state incrementally would never learn about those sibling shifts and would drift out of sync with the database after a few moves. A full refetch is trivially correct and, at this app's scale, cheap enough that the tradeoff is a non-issue.

4. `user-joined` events surface as a transient 3.2s toast rather than a persistent presence roster — the backend never emits a "user left" event on disconnect, so a persistent avatar list would eventually show people who'd left as still "present." Showing inaccurate presence was judged worse than not showing it.

### Drag and drop (`Board.tsx`)

Uses the standard `@dnd-kit` multi-container pattern:
- A local `columns` state mirrors `board.columns` and is only resynced from server data when no drag is in progress (`if (!activeId) setColumns(board.columns)`), so an in-flight drag isn't clobbered by an unrelated broadcast from another user.
- `onDragOver` optimistically moves the task between column arrays in local state for smooth cross-column visual feedback.
- `onDragEnd` computes the final index and emits a single `task:move` with the resolved `{ taskId, targetColumnId, targetPosition }`; the resulting `task:moved` broadcast (see above) reconciles everyone, including the dragger.
- `DragOverlay` renders a separate presentational-only card (`TaskCardOverlay`) rather than reusing the sortable `TaskCard` for the floating drag preview — reusing it would have registered the same sortable ID twice in dnd-kit's context.

### Minor backend-adjacent fix

Added `*.tsbuildinfo` to `frontend/.gitignore` (TypeScript's incremental build cache, generated by `tsc -b`, shouldn't be committed).

## 3. Verification performed

- `npm run build` (tsc typecheck + vite build) — passes clean, no type errors.
- Both dev servers started and smoke-tested: backend `GET /api/health` → 200; frontend `/` and `/src/main.tsx` served and transformed without error.
- Once Docker/Postgres were confirmed running: ran `prisma migrate deploy` (no-op, already applied), created a real board via `POST /api/boards`, and ran a `socket.io-client` script through the **exact** event sequence the frontend uses — `join-board` → `task:create` → `task:update` → `task:move` (Todo → Doing) → `task:delete` — confirming every event name and payload shape matches what `useBoardSocket.ts` expects, and that final DB state was consistent (no orphaned tasks, positions correct) after a move + delete.
- **Not verified**: actual rendered appearance in a browser — no browser/screenshot tool was available in this environment. The verification board (id `52b47bc7-cd97-4bd4-ba8b-87fa1817c209`, now empty) is still in the dev database if you want to open it directly.

## 4. Known limitations / possible follow-ups (not implemented)

- Backend has no `user-left` broadcast on socket disconnect — presence is intentionally toast-only rather than a persistent roster (see above). Adding that event to `board.socket.ts` would let the frontend show accurate live avatars instead.
- `task:moved` doesn't broadcast the sibling position shifts it causes in the DB — harmless given the frontend's refetch-on-event strategy, but worth knowing if another client (e.g. a future mobile app) tries to patch state incrementally instead.
- Task move/reorder is socket-only, no REST equivalent — matches existing backend design, not something I changed.
