# Exercise: socket-cors-broken

A hard debugging exercise based on real production issues when moving a
Next.js + Socket.IO + GraphQL app from local development to Docker.

---

## What This Exercise Teaches

Running an app locally and running it in Docker are different environments.
Code that works perfectly on your Mac can silently break inside a container
for reasons that are not obvious from the error messages.

This exercise covers three separate but related problems that all produce
the same symptom: "This page couldn't load. A server error occurred."

---

## The Bugs Introduced

### Bug 1 — Next.js Standalone Binds to Wrong Interface

**File:** `docker/Dockerfile`

**The problem:**
Next.js standalone mode (`output: 'standalone'`) produces a `server.js`
that by default binds to the container's network IP (e.g. `172.18.0.4:3000`)
instead of `0.0.0.0:3000`.

This means `localhost:3000` inside the container is unreachable — because
`localhost` resolves to `127.0.0.1` but nothing is listening there.

**How to spot it:**

```bash
docker exec mood-board-next-1 sh -c "netstat -tlnp | grep 3000"
# tcp  0  0  172.18.0.4:3000  0.0.0.0:*  LISTEN  ← WRONG
# Should be:
# tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  ← CORRECT
```

**Prove it:**

```bash
docker exec mood-board-next-1 sh -c "wget -q -O- http://localhost:3000/api/graphql 2>&1"
# wget: can't connect to remote host: Connection refused ← localhost unreachable
```

**The fix:**

```dockerfile
# docker/Dockerfile — runner stage
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
```

Next.js standalone `server.js` reads `HOSTNAME` and `PORT` env vars
to determine what interface to bind to. Without `HOSTNAME=0.0.0.0`
it binds to the container's specific network IP only.

---

### Bug 2 — `lib/graphql.ts` Hardcodes `localhost`

**File:** `lib/graphql.ts`

**The problem:**
The original code hardcodes `http://localhost:3000/api/graphql`:

```ts
// WRONG — hardcoded localhost
const res = await fetch("http://localhost:3000/api/graphql", { ... })
```

When Server Components run inside Docker and call `gqlFetch()`,
they fetch `localhost:3000` — which breaks if Next.js isn't listening
on `localhost` (see Bug 1). Even after Bug 1 is fixed, hardcoding
`localhost` is fragile — it breaks in staging, production, or any
environment where the URL is different.

**The fix:**

```ts
// CORRECT — environment aware
const baseUrl =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    : "";

const res = await fetch(`${baseUrl}/api/graphql`, { ... })
```

- Server side (inside Docker): uses `NEXT_PUBLIC_APP_URL`
- Client side (browser): uses relative URL `/api/graphql` — always correct

**Important — `NEXT_PUBLIC_` vars are baked at BUILD TIME:**

`NEXT_PUBLIC_` variables are not read at runtime like regular env vars.
They are replaced during `next build` and baked into the JavaScript bundle.

This means you cannot just add them to `compose.yaml` environment: —
you must pass them as Docker build args so they exist during `npm run build`.

```dockerfile
# docker/Dockerfile — builder stage
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```

```yaml
# compose.yaml
next:
  build:
    args:
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
```

```bash
# .env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**How to verify the URL is baked into the bundle:**

```bash
docker exec mood-board-next-1 sh -c \
  "grep -o 'fetch([^)]*' .next/server/chunks/ssr/*.js | head -2"
# Should show fetch(`${...}/api/graphql` not fetch("http://localhost:3000...
```

---

### Bug 3 — Socket.IO CORS Only Allows `localhost`

**File:** `server/index.ts`

**The problem:**

```ts
// WRONG — only allows localhost:3000
const io = new Server(3001, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});
```

When someone opens the app from another device on the same network
(e.g. a phone at `192.168.1.5:3000`), the Socket.IO connection is
blocked by CORS — even though the page loads fine.

The symptom is subtle: the page loads, GraphQL data appears in the
sidebar, but real-time features (cursors, emoji drops) don't work.
The browser shows "Reconnecting..." forever. No obvious error in
server logs — CORS errors only appear in the browser console.

**The fix:**

```ts
// CORRECT — allow any origin in development
const io = new Server(3001, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
```

For production, use a specific list of allowed origins:

```ts
cors: {
  origin: [
    "http://localhost:3000",
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // local network
    "https://your-production-domain.com",
  ],
}
```

---

## The Debugging Journey

### Step 1 — First symptom

```
"This page couldn't load. A server error occurred."
```

### Step 2 — Check logs

```bash
docker compose logs next | grep -i error
# TypeError: fetch failed
# code: 'ECONNREFUSED'
```

### Step 3 — Check if DB is the problem

```bash
docker exec mood-board-next-1 env | grep DATABASE
# DATABASE_URL=postgres://postgres:secret@db:5432/mood_board ← correct

docker exec -it mood-board-db-1 psql -U postgres -d mood_board -c "\dt"
# Tables exist ← DB is fine
```

### Step 4 — Check what URL is failing

```bash
docker exec mood-board-next-1 sh -c "wget -q -O- http://localhost:3000/api/graphql 2>&1"
# Connection refused ← localhost unreachable inside container!
```

### Step 5 — Check what interface Next.js is listening on

```bash
docker exec mood-board-next-1 sh -c "netstat -tlnp | grep 3000"
# tcp  0  0  172.18.0.4:3000 ← bound to container IP, not 0.0.0.0
```

### Step 6 — Root cause found

Next.js standalone mode binds to `172.18.0.4:3000` not `0.0.0.0:3000`.
`localhost:3000` inside the container = `127.0.0.1:3000` = nothing listening.

### Step 7 — Apply fixes

1. Add `ENV HOSTNAME=0.0.0.0` to `docker/Dockerfile`
2. Update `lib/graphql.ts` to use environment-aware URL
3. Add `NEXT_PUBLIC_APP_URL` as build arg
4. Update `server/index.ts` CORS to allow any origin

### Step 8 — Rebuild and verify

```bash
docker compose down
docker compose build next --no-cache
docker compose up -d

# Verify Next.js now listens on all interfaces
docker exec mood-board-next-1 sh -c "netstat -tlnp | grep 3000"
# tcp  0  0  0.0.0.0:3000 ← correct!
```

---

## Key Lessons

### 1. Always verify what interface a server is listening on

```bash
# Inside container — check binding
netstat -tlnp | grep PORT
# 0.0.0.0:PORT = reachable from anywhere including localhost
# 172.x.x.x:PORT = only reachable by IP, localhost won't work
```

### 2. `NEXT_PUBLIC_` variables are BUILD TIME not runtime

```
Regular env vars: read when the app RUNS → pass via environment: in compose.yaml
NEXT_PUBLIC_ vars: baked when the app BUILDS → must pass via ARG in Dockerfile
```

### 3. Socket.IO CORS errors are silent on the server

```
CORS failures → only visible in browser DevTools console
               NOT in docker compose logs
```

### 4. Docker build cache can be sticky — always verify

```bash
# Verify new code is in the bundle after rebuild
docker exec mood-board-next-1 sh -c \
  "grep -o 'fetch([^)]*' .next/server/chunks/ssr/*.js | head -2"
```

### 5. Never hardcode `localhost` in code that runs in multiple environments

```ts
// Wrong — breaks in Docker, staging, production
fetch("http://localhost:3000/api/graphql");

// Right — works everywhere
const baseUrl =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    : "";
fetch(`${baseUrl}/api/graphql`);
```

---

## Files Changed

| File                | What Changed                                             | Why                                  |
| ------------------- | -------------------------------------------------------- | ------------------------------------ |
| `docker/Dockerfile` | Added `ENV HOSTNAME=0.0.0.0` and `ENV PORT=3000`         | Make Next.js bind to all interfaces  |
| `docker/Dockerfile` | Added `ARG NEXT_PUBLIC_APP_URL` + `ENV` in builder stage | Pass build-time var into bundle      |
| `lib/graphql.ts`    | Environment-aware URL using `typeof window`              | Works in Docker and locally          |
| `server/index.ts`   | CORS `origin: '*'`                                       | Allow connections from any origin    |
| `compose.yaml`      | Added `NEXT_PUBLIC_APP_URL` as build arg                 | Required for build-time substitution |
| `.env`              | Added `NEXT_PUBLIC_APP_URL=http://localhost:3000`        | Source of truth for the var          |

---

## Commands Used During Debugging

```bash
# Check what's running
docker ps
docker compose logs next | tail -20
docker compose logs next | grep -i "error|refuse|fail"

# Check interfaces
docker exec mood-board-next-1 sh -c "netstat -tlnp | grep 3000"

# Test connectivity inside container
docker exec mood-board-next-1 sh -c "wget -q -O- http://localhost:3000 2>&1"

# Check env vars inside container
docker exec mood-board-next-1 env | grep DATABASE
docker exec mood-board-next-1 env | grep NEXT_PUBLIC

# Check what's baked into the bundle
docker exec mood-board-next-1 sh -c \
  "grep -o 'fetch([^)]*' .next/server/chunks/ssr/*.js | head -2"

# Force clean rebuild
docker compose build next --no-cache
```
