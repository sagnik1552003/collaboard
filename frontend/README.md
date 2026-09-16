# Collaboard — Frontend

A real-time Kanban board client for the [Collaboard backend](../README.md), built with React, TypeScript, and Vite. Talks to the Express REST API for board creation/lookup and to Socket.IO for everything that happens live: creating, editing, deleting, and drag-and-drop reordering tasks.

## Stack

- React 18 + TypeScript, bundled with Vite
- `socket.io-client` for realtime task events
- `@dnd-kit` for drag-and-drop task reordering, across and within columns
- Hand-written CSS with a small design-token system (`src/styles/tokens.css`) — no UI framework

## Setup

1. Make sure the [backend](../README.md) is running (`npm run dev` from the repo root, with Postgres up).
2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173`.

Configure the API/Socket.IO origin via `.env` (defaults to `http://localhost:3000`):

```env
VITE_API_URL=http://localhost:3000
```

## How it works

- **Home** (`/`) — set your display name (kept in `localStorage`), then create a board or join one by ID.
- **Board** (`/board/:id`) — fetches the board over REST, then opens a socket connection and emits `join-board`. Task mutations (create/edit/delete/move) are emitted as socket events rather than REST calls, so every connected client — including the one that made the change — reconciles from the same broadcast.
- On any `task:*` event from the server, the client refetches the full board via REST rather than patching local state incrementally. The backend's `task:move` handler shifts sibling task positions in the database but only broadcasts the moved task itself, so patching locally would let position numbers drift between clients over multiple moves; a full refetch avoids that.
- Drag-and-drop (`@dnd-kit`) reorders a local mirror of the board for instant visual feedback, then emits `task:move` with the resulting column/index; the follow-up broadcast reconciles it.

## Scripts

| Script          | Description                          |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start the Vite dev server (port 5173)  |
| `npm run build` | Typecheck and build for production     |
| `npm run preview` | Preview the production build locally |
