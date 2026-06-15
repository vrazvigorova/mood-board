FROM node:20-alpine AS deps
WORKDIR /app
COPY . .                
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node

EXPOSE 3000
CMD ["node", "server.js"]

# ============================================================
# BUG: broken-layer-cache
# ============================================================
# PROBLEM: COPY . . before RUN npm ci busts the cache on
# every code change — even when package.json hasn't changed.
#
# HOW TO REPRODUCE:
#   1. Build once:
#      docker compose build next --progress=plain
#
#   2. Change any source file (e.g. add a comment to MoodBoard.tsx):
#      echo "// test" >> components/MoodBoard.tsx
#
#   3. Build again:
#      docker compose build next --progress=plain
#
# RESULT: You'll see "RUN npm ci" is NOT cached — it reinstalls
# all packages even though package.json didn't change.
#
# FIX: Copy package.json FIRST, run npm ci, THEN copy source:
#   COPY package.json package-lock.json ./
#   RUN npm ci
#   COPY . .
#
# RULE: Things that change rarely → top of Dockerfile (cached longer)
#        Things that change often  → bottom of Dockerfile
# ============================================================
