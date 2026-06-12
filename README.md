# Mood Board

A real-time collaborative mood board built as a **senior frontend interview preparation project**, designed to demonstrate production-level architecture patterns.

---

## What This Project Is

This project was built incrementally across two phases as a practical learning exercise covering:

- Real-time communication with **WebSockets (Socket.IO)**
- Progressive server-side rendering with **Next.js App Router streaming + Suspense**
- Typed API layer with **GraphQL (GraphQL Yoga)**
- Persistent storage with **PostgreSQL + Drizzle ORM**
- Client-side GraphQL with **Apollo Client**

Each technology was chosen deliberately to reflect the stack and architectural decisions a senior frontend developer would encounter at a large-scale e-commerce platform.

---

## The Task

> Build a live collaborative mood board where multiple users in the same "room" can drop emoji reactions onto a canvas and see each other's cursors moving in real time.

The core requirement was to combine **three different real-time/data technologies** in one app and understand when and why to use each one:

| Scenario                | Technology             | Why                                                     |
| ----------------------- | ---------------------- | ------------------------------------------------------- |
| Live cursor positions   | WebSockets (Socket.IO) | High-frequency, bidirectional                           |
| Emoji drops (live)      | WebSockets (Socket.IO) | Needs to reach all clients instantly                    |
| Room info, participants | GraphQL + SSR          | Server-to-client, benefits from streaming               |
| Emoji history           | GraphQL + SSR          | Persistent, queryable, slow query demonstrates Suspense |
| Persistent storage      | PostgreSQL + Drizzle   | Real data survives page refresh                         |

---

## Architecture

```
Browser
  ├── HTTP/2 Streaming (Next.js)
  │     └── Page shell → 3 Suspense boundaries stream in independently
  │           └── Each Server Component → POST /api/graphql → lib/data.ts → PostgreSQL
  │
  └── WebSocket (Socket.IO)
        └── MoodBoard client → server/index.ts (port 3001)
              cursor_move, emoji_drop, user_join, user_leave
```

```
┌─────────────────────────────────────────────────────┐
│                 Next.js App (port 3000)              │
│                                                      │
│  RoomInfo ──────────────────────────────────────┐   │
│  ParticipantsList ──► POST /api/graphql          │   │
│  EmojiHistory ──────────────────────────────┐   │   │
│                                              ▼   ▼   │
│                                           lib/data.ts│
│                                              │       │
│                                              ▼       │
│                                         PostgreSQL    │
└──────────────────────────────────────────────────────┘
         ▲
         │ WebSocket (port 3001)
         │
    Socket.IO Server
    MoodBoard canvas
```

---

## Stack

| Layer          | Technology           | Version |
| -------------- | -------------------- | ------- |
| Framework      | Next.js (App Router) | 16      |
| Language       | TypeScript           | 5       |
| Styling        | Tailwind CSS         | 4       |
| Real-time      | Socket.IO            | 4       |
| GraphQL Server | GraphQL Yoga         | latest  |
| GraphQL Client | Apollo Client        | latest  |
| ORM            | Drizzle ORM          | latest  |
| Database       | PostgreSQL           | 16      |
| Runtime        | Node.js              | 20+     |

---

## What We Built — Phase by Phase

### Phase 1 — Core Application

Built the full working app with mock data first, then wired up real-time:

**`types/index.ts`** — shared TypeScript types and typed Socket.IO event interfaces using discriminated unions.

**`lib/data.ts`** — mock data layer with artificial delays (300ms / 1000ms / 2500ms) to demonstrate progressive streaming via Suspense boundaries.

**`server/index.ts`** — standalone Socket.IO server on port 3001. Manages rooms natively with `socket.join()`, broadcasts typed events (`cursor_move`, `emoji_drop`, `user_join`, `user_leave`), assigns random userId and colour on connect.

**`hooks/useSocketIO.ts`** — custom React hook managing the Socket.IO lifecycle. Uses `isConnected` as the `useEffect` dependency (not `socketRef`) to correctly trigger listener registration after the socket connects. Returns `socketRef` (not `socketRef.current`) to comply with React 19's ref-during-render rule.

**`components/MoodBoard.tsx`** — full-screen canvas Client Component. Throttles `cursor_move` events to every 50ms using `useRef` (not state) for the timer. Renders other users' cursors as coloured dots and emoji drops with a float-fade CSS animation.

**`components/EmojiPicker.tsx`** — emoji selector toolbar, fixed at top centre.

**`components/RoomInfo.tsx`**, **`ParticipantsList.tsx`**, **`EmojiHistory.tsx`** — async Server Components. Each fetches its own data independently and renders inside its own `<Suspense>` boundary so they stream in at different speeds.

**`components/skeletons/`** — three skeleton components used as Suspense fallbacks.

**`app/room/[roomId]/page.tsx`** — Server Component with three independent `<Suspense>` boundaries. The page shell renders instantly; data sections stream in as each async Server Component resolves.

**`app/room/[roomId]/loading.tsx`** — route-level automatic Suspense boundary (full-page skeleton on first load).

---

### Phase 2 — GraphQL Layer

Added a typed GraphQL API in front of the data layer without changing any component or real-time code:

**`app/api/graphql/route.ts`** — GraphQL Yoga Route Handler. Defines schema (`RoomInfo`, `Participant`, `EmojiDrop` types + `Query` type) and resolvers that delegate to `lib/data.ts`. Works natively as a Next.js Route Handler with no adapter — uses the Fetch API.

**`lib/graphql.ts`** — lightweight `gqlFetch()` helper for Server Components to POST to `/api/graphql`. No Apollo needed server-side — plain `fetch` is enough.

**`lib/apollo-client.tsx`** — `ApolloWrapper` Client Component provider for optional client-side `useQuery` hooks.

The three Server Components (`RoomInfo`, `ParticipantsList`, `EmojiHistory`) were updated to call `gqlFetch()` with typed GraphQL queries instead of calling `lib/data.ts` directly. The Suspense boundaries, page structure, and Socket.IO layer were untouched.

**Why GraphQL Yoga over Apollo Server:** Yoga is built on the Fetch API, works natively as a Next.js Route Handler with zero configuration, is lighter, and supports edge deployments. Apollo Server requires an adapter for App Router.

---

### Phase 3 — PostgreSQL + Drizzle ORM

Replaced mock data with a real persistent database:

**`db/schema/shared/timestamps.ts`** — shared `createdAt` / `updatedAt` columns using `timestamp({ withTimezone: true, mode: 'string' })` — returns ISO strings from Postgres, consistent with TypeScript types throughout the app.

**`db/schema/rooms.ts`** — `rooms` table. Primary key is the `roomId` text string from the URL (e.g. `"abc"`). Auto-created on first visit if it doesn't exist.

**`db/schema/participants.ts`** — `participants` table. Foreign key to `rooms.id` with `onDelete: 'cascade'`. Records every user who has joined a room.

**`db/schema/emoji-drops.ts`** — `emoji_drops` table. UUID primary key, foreign key to `rooms.id`. Persists every emoji drop so history survives page refresh.

**`db/index.ts`** — single shared Drizzle client with `casing: 'snake_case'` — TypeScript camelCase maps automatically to snake_case in Postgres.

**`drizzle.config.ts`** — follows the `isCi` guard pattern: `dbCredentials` are only set when not in CI, allowing migration generation without a live database in pipelines. Exports `drizzleCasing` as a const used in both the config and the Drizzle client.

**`lib/try-catch.ts`** — shared `tryCatch<T>()` utility returning `[data, null] | [null, Error]` tuples. Same pattern as `tryCatchAsync` from production codebases — eliminates scattered `try/catch` blocks.

**`lib/data.ts`** — replaced mock functions with real Drizzle queries using explicit column selection in `.select()` and `.returning()`. Uses `tryCatch` for every DB call.

**`db/seed.ts`** — seed script using `.onConflictDoNothing()` so it's safe to run multiple times.

---

## Key Concepts Demonstrated

**Why SSE was not used here:** Cursor movement is high-frequency and bidirectional — every client sends position AND receives all others'. SSE is server-to-client only. Socket.IO was the right choice.

**Why three separate Suspense boundaries:** Each data source resolves at a different speed. Independent boundaries mean fast data (room info) renders immediately while slow data (emoji history) streams in later. A single boundary would block everything on the slowest query.

**Why `isConnected` as `useEffect` dependency:** Refs don't trigger re-renders when they change, so using `socketRef` as a dependency means the listener `useEffect` never re-runs after the socket connects. `isConnected` is state — it flips to `true` on connect and correctly triggers the effect.

**Why `mode: 'string'` on timestamps:** Drizzle by default returns `Date` objects from Postgres timestamp columns. `mode: 'string'` returns ISO strings instead, consistent with the TypeScript types used throughout the app and in components that render dates as text.

**Why `casing: 'snake_case'`:** Write TypeScript in camelCase (`createdAt`, `roomId`), Drizzle automatically maps to `snake_case` in Postgres (`created_at`, `room_id`). No manual column aliases needed.

---

## Project Structure

```
mood-board/
├── app/
│   ├── api/graphql/route.ts      # GraphQL Yoga endpoint
│   ├── room/[roomId]/
│   │   ├── page.tsx              # 3 Suspense boundaries + MoodBoard
│   │   └── loading.tsx           # Route-level skeleton
│   ├── layout.tsx                # ApolloWrapper + fonts
│   └── page.tsx                  # Redirects to /room/abc
├── components/
│   ├── skeletons/                # 3 Suspense fallback skeletons
│   ├── EmojiHistory.tsx          # Async Server Component
│   ├── EmojiPicker.tsx           # Client Component
│   ├── MoodBoard.tsx             # Client Component — canvas + WebSockets
│   ├── ParticipantsList.tsx      # Async Server Component
│   └── RoomInfo.tsx              # Async Server Component
├── db/
│   ├── migrations/               # Generated SQL migration files
│   ├── schema/
│   │   ├── shared/timestamps.ts  # Shared timestamp columns
│   │   ├── emoji-drops.ts
│   │   ├── participants.ts
│   │   └── rooms.ts
│   ├── index.ts                  # Drizzle client
│   └── seed.ts                   # Seed script
├── hooks/
│   └── useSocketIO.ts            # Socket.IO hook
├── lib/
│   ├── apollo-client.tsx         # Apollo provider
│   ├── data.ts                   # Drizzle queries
│   ├── graphql.ts                # gqlFetch helper
│   └── try-catch.ts              # [data, error] tuple helper
├── server/
│   └── index.ts                  # Socket.IO server (port 3001)
├── types/
│   └── index.ts                  # Shared TS types + Socket.IO interfaces
└── drizzle.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

`.env`:

```
DATABASE_URL=postgres://postgres:secret@localhost:5432/mood_board
```

### 3. Start PostgreSQL

```bash
docker run -d \
  --name mood-board-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=mood_board \
  -p 5432:5432 \
  postgres:16
```

### 4. Run migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the app

```bash
npm run dev
```

Open two tabs at `http://localhost:3000/room/abc` and move your mouse — you'll see live cursors sync between tabs.

---

## Scripts

| Command               | Description                                     |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Start Socket.IO server + Next.js concurrently   |
| `npm run dev:next`    | Next.js only                                    |
| `npm run dev:server`  | Socket.IO server only                           |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:migrate`  | Apply pending migrations                        |
| `npm run db:seed`     | Seed the database with sample data              |
| `npm run db:studio`   | Open Drizzle Studio (visual DB browser)         |
| `npm run build`       | Production build                                |
| `npm run lint`        | Run ESLint                                      |

---

## Environment Variables

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |

---

## What Comes Next

- **Docker Compose** — containerise all three services (Next.js, Socket.IO, PostgreSQL) with healthchecks, named volumes, and `depends_on`
- **gRPC microservices** — split Room Service and Emoji Service into separate gRPC servers
- **Persist emoji drops from Socket.IO** — write to DB when a drop event fires, not just on page load
- **Auth** — session-based room ownership
