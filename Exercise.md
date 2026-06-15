What you do: Delete .env, run docker compose up.
What happens: DATABASE_URL is undefined — Drizzle throws immediately on startup.
Why: Teaches the difference between env vars that go in .env (local dev, outside Docker) vs env vars set directly in compose.yaml (inside Docker). Inside Docker, compose.yaml is the source of truth — .env is only for running outside containers.
Fix: Either recreate .env or confirm the vars are already in compose.yaml.
