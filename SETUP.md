# Fin-Folio — Local Setup Guide

## Prerequisites

- **Node.js** 20+
- **pnpm** 10.x
- **Docker Desktop** (for PostgreSQL)

---

## Step 1: Clone & Install

```bash
git clone <repo-url>
cd fin-folio
pnpm install
```

---

## Step 2: One-Command Setup

```bash
pnpm run setup
```

This single command:

1. Copies `.env.example` → `.env.local` / `.env` for each app and package (skips existing files)
2. Starts the Docker Postgres container
3. Runs all pending database migrations

After it completes, you're ready to start developing.

---

## Infrastructure

| Service        | Port   | Details                                                |
| -------------- | ------ | ------------------------------------------------------ |
| **PostgreSQL** | `5433` | User: `finfolio`, Password: `finfolio`, DB: `finfolio` |

> Port **5433** (not 5432) is used intentionally so fin-folio never conflicts with any other local PostgreSQL instance.

---

## Step 3: Start the Backend

```bash
pnpm dev
```

The API starts at **`http://localhost:3000`**.

> [!IMPORTANT]
> `pnpm dev` does **not** run migrations. Migrations are always an explicit step via `pnpm run setup` or `pnpm db:migrate`.

---

## Environment Files

### `apps/core/.env.local`

Created automatically by `pnpm run setup` from `.env.example`. Key variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://finfolio:finfolio@localhost:5433/finfolio
LOG_LEVEL=debug
```

### `packages/db/.env`

Created automatically by `pnpm run setup` from `.env.example`. Used by drizzle-kit CLI commands:

```env
DATABASE_URL=postgresql://finfolio:finfolio@localhost:5433/finfolio
```

---

## Daily Workflow

```bash
pnpm run infra:start  # start Docker services (after a reboot or docker stop)
pnpm dev              # start the backend in watch mode
```

---

## Schema Changes

When you modify a table definition in `packages/db/src/schemas/`:

```bash
# Generate a migration — always pass a name to describe what changed
pnpm run db:generate <name>

# Examples:
pnpm run db:generate create_accounts_table
pnpm run db:generate add_avatar_url_to_users
pnpm run db:generate add_idx_sessions_expires_at

# Apply pending migrations to your local DB
pnpm run db:migrate
```

**Naming convention:** lowercase with underscores, verb first — `create_`, `add_`, `drop_`, `rename_`.

Always commit the generated files in `packages/db/drizzle/` alongside the schema change.

---

## Useful Commands

```bash
# Build all packages
pnpm build

# Lint everything
pnpm lint

# Type-check everything
pnpm typecheck

# Run unit tests (no DB required)
pnpm test

# Run unit tests for a specific app
pnpm --filter @fin-folio/core run test

# Run E2E tests (requires running Postgres)
pnpm --filter @fin-folio/core run test:e2e

# Open Drizzle Studio (schema-aware DB UI)
pnpm --filter @fin-folio/db db:studio

# Start / stop Docker only
pnpm run infra:start
pnpm run infra:stop

# Run migrations without full setup
pnpm run db:migrate
```

---

## Inspecting the Database

**DBeaver / pgAdmin / TablePlus:**

| Field    | Value       |
| -------- | ----------- |
| Host     | `localhost` |
| Port     | `5433`      |
| Database | `finfolio`  |
| User     | `finfolio`  |
| Password | `finfolio`  |

**Drizzle Studio (schema-aware browser UI):**

```bash
pnpm --filter @fin-folio/db db:studio
```

## Starting Fresh

To completely wipe all data and start over:

```bash
docker compose down -v       # removes containers + named volumes (all data gone)
pnpm run setup                   # re-creates containers, re-runs migrations
```

---

## Troubleshooting

| Issue                                       | Fix                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `Docker CLI not found`                      | Start Docker Desktop and ensure `docker` is on your PATH                        |
| `connection refused` on port 5433           | Run `pnpm run infra:start` — the Postgres container is not running              |
| `DATABASE_URL` not set                      | Run `pnpm run env:copy` to create missing env files                             |
| Type errors after schema change             | Run `pnpm --filter @fin-folio/db build` then restart your IDE's TS server       |
| `Cannot find module '@fin-folio/db/nestjs'` | Run `pnpm --filter @fin-folio/db build` (dist/ must exist before type-checking) |
