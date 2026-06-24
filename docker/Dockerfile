FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
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

# Never run as root
# USER node

EXPOSE 3000
CMD ["node", "server.js"]

#Issue:Missing USER node from both Dockerfiles.
#What happens: App runs as root inside the container — a security vulnerability.
#Verified with docker exec -it mood-board-next-1 whoami -> we see root and that's a problem
# docker exec -it mood-board-next-1 sh -c "echo hacked > /etc/test" -> we can write on root
# we verify that we've written on root docker exec -it mood-board-next-1 cat /etc/test 