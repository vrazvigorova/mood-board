# Exercise: docker-healthcheck-timeout

## The Bug

compose.yaml db healthcheck has unrealistic values:

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
  interval: 1s # too aggressive
  timeout: 1s # too short
  retries: 1 # too few
  start_period: 1s # too short — Postgres needs 3-5s to initialize
```

## Reproduce

Must delete volume first — otherwise Postgres starts instantly from existing data:

```bash
docker compose down -v
docker compose up
```

next and server never start because db never becomes healthy.

## Investigate

```bash
docker inspect mood-board-db-1 | grep -A 10 '"Health"'
docker inspect mood-board-db-1 | grep FailingStreak
docker compose logs next | head -5
```

## What Each Value Means

| Setting      | What it does                                      |
| ------------ | ------------------------------------------------- |
| interval     | How often to run pg_isready                       |
| timeout      | Max time allowed per check                        |
| retries      | Failures before marking unhealthy                 |
| start_period | Grace period before checks begin ← most important |

## Fix

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
  interval: 5s
  timeout: 3s
  retries: 5
  start_period: 10s # gives Postgres time to fully initialize
```

## Key Lesson

start_period is the critical one. Without it Docker checks immediately,
Postgres isn't ready yet, db is marked unhealthy, next never starts.
