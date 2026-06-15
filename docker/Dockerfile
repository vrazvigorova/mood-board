# Stage 1 — deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2 — builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 — runner (BROKEN)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# BUG: copying entire builder stage instead of just the built output
# This pulls in source code, node_modules, and potentially .env files
COPY --from=builder /app ./

USER node
EXPOSE 3000
CMD ["node", "server.js"]