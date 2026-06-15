# Disk Usage and Cleanup

Prerequisites

```bash
docker compose up -d
```

## 1. Check Current Disk Usage

```bash
docker system df
```

Shows: images, containers, volumes, build cache sizes.

## 2. Accumulate Build Cache

```bash
docker compose build next
echo "// cache 1" >> components/MoodBoard.tsx
docker compose build next
echo "// cache 2" >> components/MoodBoard.tsx
docker compose build next
```

## 3. Check Disk Again — Cache Has Grown

```bash
docker system df
```

Compare build cache size to step 1 — it grew with each build.

## 4. Safe Prune — Does NOT Touch Volumes

```bash
docker system prune -f
```

Removes: stopped containers, dangling images, build cache.
Does NOT remove: named volumes (pgdata), running containers.

## 5. Verify pgdata Volume Still Exists

```bash
docker volume ls
```

pgdata should still be there — your database is safe.

## 6. Targeted Cleanup Options

```bash
docker container prune -f   # stopped containers only
docker image prune -f       # dangling images only
docker builder prune -f     # build cache only
```

## 7. THE DANGEROUS COMMAND — Never Run in Production

```bash
# docker system prune -a --volumes
# Deletes EVERYTHING including pgdata = entire database gone
# Only use this to completely reset Docker from scratch
```

- docker system df → see disk usage by category
- docker system prune -f → safe cleanup, keeps volumes
- docker system prune -a → removes ALL images including base images
- docker system prune --volumes → ALSO deletes named volumes (pgdata!)
- docker volume ls → verify your volumes survived cleanup
- Build cache grows with every build — prune it regularly
