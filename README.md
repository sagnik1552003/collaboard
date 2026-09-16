# Collaboard

A real-time collaborative Kanban board backend. Boards contain ordered columns, columns contain ordered tasks, and every mutation (create/update/delete/move) is broadcast live to everyone viewing the same board over Socket.IO.

A React client lives in [`frontend/`](frontend/README.md) — see that README for setup.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **HTTP**: Express 5
- **Realtime**: Socket.IO 4
- **Database**: PostgreSQL, via Prisma ORM 7 (`@prisma/adapter-pg` driver adapter)
- **Validation**: Zod
- **Dev tooling**: `tsx` (dev server with watch mode), `tsc` (build)

## Features

- Create a board, which is automatically seeded with three columns: **Todo**, **Doing**, **Done**
- Fetch a board with its columns and tasks, ordered by position
- Create, update, and delete tasks via REST
- Real-time task create/update/delete/move via Socket.IO, broadcast to every client in the board's room
- Position-aware task reordering (`moveTask`) that shifts sibling task positions correctly, both within a column and across columns, inside a single DB transaction
- Server-side ownership checks on every socket event (a task/column must belong to the board the socket has joined before it can be mutated)

## Project Structure

```
src/
├── app.ts                        # Express app: middleware + route mounting
├── server.ts                     # HTTP server bootstrap, attaches Socket.IO
├── lib/
│   └── prisma.ts                 # Prisma client singleton (pg driver adapter)
├── routes/
│   └── health.routes.ts          # GET /api/health
├── modules/
│   ├── boards/
│   │   ├── board.routes.ts
│   │   ├── board.controller.ts
│   │   └── board.service.ts
│   └── tasks/
│       ├── task.routes.ts
│       ├── task.controller.ts
│       └── task.service.ts       # includes moveTask (position reshuffling)
└── sockets/
    ├── index.ts
    └── board.socket.ts           # all Socket.IO event handlers

prisma/
├── schema.prisma
└── migrations/
```

Each module follows a **routes → controller → service** layering: routes wire HTTP verbs to controllers, controllers handle request parsing/validation (Zod) and HTTP responses, and services contain the actual Prisma queries/business logic. Socket handlers reuse the same service functions as the REST controllers.

## Data Model

```
Board
 └── Column (ordered by `position`, unique per board)
      └── Task (ordered by `position`, unique per column)
```

- `Board`: `id`, `name`, `createdAt`, `updatedAt`
- `Column`: `id`, `name`, `position`, `boardId` (cascades on board delete)
- `Task`: `id`, `title`, `description?`, `position`, `columnId` (cascades on column delete)

See [prisma/schema.prisma](prisma/schema.prisma) for the full schema.

## Prerequisites

- Node.js (18+ recommended)
- Docker (for the bundled Postgres container), or your own PostgreSQL instance

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start PostgreSQL**

   ```bash
   docker compose up -d
   ```

   This starts Postgres 16 with database `collaboard`, user `collaboard`, password `collaboard_password`, exposed on `localhost:5432`.

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   PORT=3000
   DATABASE_URL="postgresql://collaboard:collaboard_password@localhost:5432/collaboard?schema=public"
   ```

   | Variable       | Description                              | Default |
   | -------------- | ----------------------------------------- | ------- |
   | `PORT`         | Port the HTTP/Socket.IO server listens on | `3000`  |
   | `DATABASE_URL` | PostgreSQL connection string              | —       |

4. **Run database migrations**

   ```bash
   npx prisma migrate deploy
   ```

   (Use `npx prisma migrate dev` instead if you're actively developing schema changes.)

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   The server starts on `http://localhost:3000` (or your configured `PORT`), watching for file changes.

## Scripts

| Script          | Description                                    |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Start the server in watch mode via `tsx`         |
| `npm run build` | Type-check and compile TypeScript to `dist/`     |
| `npm start`     | Run the compiled server from `dist/server.js`    |

## REST API

Base path: `/api`

### Health

| Method | Path      | Description             |
| ------ | --------- | ------------------------ |
| GET    | `/health` | Liveness check           |

### Boards

| Method | Path         | Body                          | Description                                   |
| ------ | ------------ | ------------------------------ | ---------------------------------------------- |
| POST   | `/boards`    | `{ name: string }`             | Create a board (seeded with 3 default columns) |
| GET    | `/boards/:id`| —                               | Get a board with its columns and tasks         |

### Tasks

| Method | Path         | Body                                              | Description        |
| ------ | ------------ | -------------------------------------------------- | ------------------- |
| POST   | `/tasks`     | `{ columnId: string, title: string, description?: string }` | Create a task       |
| PATCH  | `/tasks/:id` | `{ title?: string, description?: string }`         | Update a task        |
| DELETE | `/tasks/:id` | —                                                   | Delete a task        |

All request bodies are validated with Zod; validation failures return `400` with an `errors` array, and unexpected failures return `500`.

> Note: task **moving/reordering** is only exposed over Socket.IO (`task:move`), not REST.

## Socket.IO Events

Connect to the server root and emit `join-board` before any task events — the server rejects task mutations from sockets that haven't joined a board, and validates that every task/column referenced actually belongs to the joined board.

### Client → Server

| Event          | Payload                                                             | Description                              |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| `join-board`   | `{ boardId: string, userName: string }`                              | Join a board's room                       |
| `task:create`  | `{ columnId: string, title: string, description?: string }`         | Create a task                              |
| `task:update`  | `{ taskId: string, title?: string, description?: string }`          | Update a task                              |
| `task:delete`  | `{ taskId: string }`                                                  | Delete a task                              |
| `task:move`    | `{ taskId: string, targetColumnId: string, targetPosition: number }` | Move/reorder a task within or across columns |

### Server → Client

| Event           | Payload                            | Broadcast to                          |
| --------------- | ----------------------------------- | --------------------------------------- |
| `board-joined`  | `{ boardId, userName }`             | The joining socket                     |
| `user-joined`   | `{ socketId, userName }`             | Everyone else in the board's room      |
| `task:created`  | `{ task }`                          | Whole board room                       |
| `task:updated`  | `{ task }`                          | Whole board room                       |
| `task:deleted`  | `{ taskId }`                        | Whole board room                       |
| `task:moved`    | `{ task }`                          | Whole board room                       |
| `error`         | `{ message: string }`               | The socket that triggered the error    |

## Database

Postgres schema and migrations are managed by Prisma. Common commands:

```bash
npx prisma studio          # browse data in a GUI
npx prisma migrate dev     # create + apply a new migration
npx prisma generate        # regenerate the Prisma client
```
