# Exercise: docker-multi-stage-leak

Learn what actually ends up inside your production Docker image and why
accidentally copying too much is a serious security and performance problem.

---

## What This Exercise Teaches

Multi-stage Docker builds exist for one reason: keep the production image
small and clean. The builder stage does the heavy work. The runner stage
should only contain the minimum needed to run the app.

When you accidentally copy everything from the builder into the runner,
you leak source code, credentials, and hundreds of MB of unnecessary files
into the production image.

---

## The Bug

File: docker/Dockerfile — runner stage

```dockerfile
# WRONG — copies entire builder stage into production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app ./   # copies EVERYTHING including source code

USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Investigation — Answers

### 1. How Much Bigger is the Image?

```bash
docker images | grep mood-board-next
```

| Version                    | Approximate Size |
| -------------------------- | ---------------- |
| Correct (standalone only)  | ~150MB           |
| Broken (full builder copy) | ~1.30GB          |

The broken image is 5-6x larger because it includes:

- node_modules — hundreds of MB of dev dependencies
- All TypeScript source files
- Build artifacts from both stages

---

### 2. What Sensitive Files Are Inside the Image?

```bash
# Inspect without starting the server
docker run --rm --entrypoint sh mood-board-next -c "ls -la"
docker run --rm --entrypoint sh mood-board-next -c "ls components/"
docker run --rm --entrypoint sh mood-board-next -c "ls server/"
docker run --rm --entrypoint sh mood-board-next -c "ls db/"
docker run --rm --entrypoint sh mood-board-next -c "cat lib/data.ts"
```

Files leaked into the broken image:

- components/ all React components — business logic
- server/ Socket.IO server code
- db/ database schema, migrations, seed scripts
- lib/ data access layer, GraphQL helpers
- node_modules/ ALL dependencies including devDependencies
- drizzle.config.ts database configuration

---

### 3. Why is This a Security Problem Even if Registry is Private?

Private registry does not equal secure image contents.

Scenario 1 — Registry breach:
Attacker gains access to your private Docker registry
Pulls the image and reads all source code and DB schema
Understands your entire architecture instantly

Scenario 2 — Insider threat:
Junior developer has pull access to the registry
Can read production source code they should not have access to

Scenario 3 — Container escape:
Attacker exploits a vulnerability in the running app
Escapes to container filesystem
Reads full source code and finds hardcoded secrets

Scenario 4 — Accidental sharing:
Someone exports the image to share with a partner
Accidentally shares all source code and credentials

The principle of least privilege applies to images too:
the production image should contain only what is needed to run.

---

### 4. The Correct Dockerfile Pattern

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Only copy exactly what is needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

next build with output: standalone produces a self-contained server.js
that includes only the exact dependencies it needs — no node_modules needed.

---

## Why the Container Keeps Restarting

Copying node_modules from the builder conflicts with the standalone server.js
which does not expect node_modules to be present. The server crashes on startup
and restart: unless-stopped keeps trying to bring it back.

A container in a restart loop is often a filesystem or dependency conflict,
not a code bug.

---

1. Multi-stage builds keep the production image small and clean
2. COPY --from=builder /app ./ copies EVERYTHING — source, node_modules, configs
3. Production images should only contain what is needed to RUN the app
4. Private registry does not mean safe — defence in depth matters
5. output: standalone = self-contained server, no node_modules needed at runtime
6. A restarting container = often a filesystem conflict, not a code bug
7. Always check image size — an 800MB Next.js image is a red flag

---

## Commands Used

```bash
# Inspect image without starting the server
docker run --rm --entrypoint sh mood-board-next -c "ls -la"

# Check image size
docker images | grep mood-board-next

# Check restart loop
docker inspect mood-board-next-1 | grep RestartCount

# Watch container status
docker ps
```
