# Docker Compose Config Debugging

docker compose config is the best debugging tool — it shows
the fully resolved compose.yaml with all variables substituted
BEFORE any containers start. Use it to catch problems early.

Prerequisites

```bash
docker compose up -d
```

## 1. Print Fully Resolved Config

```bash
docker compose config
```

All ${VARS} are replaced with real values from .env.
Use this to verify your config before starting containers.

## 2. Verify DATABASE_URL is Correct

```bash
docker compose config | grep DATABASE_URL
```

Should show db:5432 not localhost:5432 for the next service.
If it shows localhost — see bug/wrong-hostname.

## 3. Check All Env Vars for Next Service

```bash
docker compose config | grep -A 20 "next:"
```

## 4. Demonstrate Missing Variable

Add a broken variable to compose.yaml next service temporarily:

```yaml
environment:
  TEST_VAR: ${MISSING_VAR}
```

Then run:

```bash
docker compose config | grep TEST_VAR
# TEST_VAR: ''  ← empty string — MISSING_VAR not in .env
```

## 5. Fix by Adding to .env

```bash
echo "MISSING_VAR=hello" >> .env
docker compose config | grep TEST_VAR
# TEST_VAR: hello  ← now correctly substituted
```

- docker compose config → see fully resolved config before starting
- docker compose config | grep → check specific values
- Empty ${VAR} = missing from .env — not an error, just empty string
- Always run docker compose config before debugging a startup issue
- It shows you exactly what Docker sees — no guessing about variables
