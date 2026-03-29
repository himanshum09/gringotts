# Fin-Folio Monorepo

## Project Overview

Fin-Folio is a TypeScript monorepo containing a NestJS backend API and a React frontend application, managed with pnpm workspaces and Turborepo.

## Monorepo Structure

```
fin-folio/
├── apps/
│   ├── core/              # NestJS backend API
│   └── web-app/           # React + Vite frontend
├── packages/
│   ├── db/                # Drizzle ORM schemas, migrations, DB client (@fin-folio/db)
│   ├── o11y/              # Structured logging + NestJS observability (@fin-folio/o11y)
│   ├── eslint-config/     # Shared ESLint configurations (base, node, react)
│   └── tsconfig/          # Shared TypeScript configurations (base, node, react)
├── scripts/
│   └── setup.mjs          # One-command local dev setup (infra + migrations)
├── services/              # Future microservices
├── docker-compose.yml     # Local PostgreSQL container (port 5433)
├── turbo.json             # Turborepo task pipeline
└── pnpm-workspace.yaml
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 10.x (workspaces)
- **Build Orchestrator**: Turborepo
- **Backend**: NestJS 11, TypeScript 5.7
- **Frontend**: React 19, Vite 7, TypeScript 5.7
- **Database**: PostgreSQL 17 (Docker), Drizzle ORM 0.44+, drizzle-kit 0.31+
- **Observability**: Pino structured logging via `@fin-folio/o11y`
- **Testing**: Jest 30 (backend), Supertest (e2e)
- **Linting**: ESLint 9 (flat config), Prettier 3
- **Git Hooks**: Husky + lint-staged

## Commands

Run all commands from the monorepo root unless stated otherwise.

```bash
# Development
pnpm build             # Build all packages and apps
pnpm dev               # Start all apps in development mode
pnpm lint              # Lint all packages and apps
pnpm typecheck         # Type-check all packages and apps
pnpm test              # Run tests across all packages and apps

# Setup (first time or fresh clone)
pnpm setup             # Copy env files + start Docker + run migrations

# Infrastructure
pnpm run infra:start    # Start Docker Postgres container
pnpm infra:stop        # Stop Docker Postgres container

# Database
pnpm db:migrate        # Apply pending Drizzle migrations
pnpm env:copy          # Copy .env.example files only (no docker/migrations)
```

See **[SETUP.md](./SETUP.md)** for the full first-run walkthrough.

### App-specific commands

**Backend** (`apps/core`):

```bash
pnpm run dev           # Watch mode (nest start --watch)
pnpm run start:debug   # Debug + watch mode
pnpm run test          # Unit tests
pnpm run test:e2e      # End-to-end tests
pnpm run test:cov      # Test coverage
```

**Frontend** (`apps/web-app`):

```bash
pnpm run dev           # Vite dev server with HMR
pnpm run build         # TypeScript compile + Vite production build
pnpm run preview       # Preview production build locally
```

**Database** (`packages/db`):

```bash
pnpm run db:generate <name>                              # Generate migration from schema changes
pnpm run db:migrate                            # Apply pending migrations
pnpm --filter @fin-folio/db run db:studio      # Open Drizzle Studio browser UI
```

## Coding Standards

### TypeScript

- Strict mode is enabled globally via `@fin-folio/tsconfig/base.json`
- All strict checks are on: `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`
- Prefix unused function parameters with `_` (enforced by ESLint)
- Use `type` imports when importing only types: `import type { Foo } from './foo'`

### Formatting (Prettier)

- Semicolons: yes
- Single quotes: yes
- Trailing commas: all
- Print width: 100
- Indent: 2 spaces, no tabs

### Linting (ESLint 9 flat config)

- Shared configs live in `packages/eslint-config/` with three presets: `base`, `node`, `react`
- `@typescript-eslint/no-explicit-any` is a warning, not an error
- `@typescript-eslint/no-extraneous-class` is off (NestJS modules are empty classes)
- `@typescript-eslint/no-non-null-assertion` is off
- `@typescript-eslint/no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-argument` are off — false positives on NestJS dynamic module patterns (`forRoot`, `forFeature`) from workspace packages
- `scripts/` directory is excluded from ESLint — plain Node.js `.mjs` scripts don't need TS-ESLint

### Git Hooks

Pre-commit runs automatically via Husky + lint-staged:

- `*.{ts,tsx}` files: `eslint --fix` then `prettier --write`
- `*.{json,md,yaml,yml}` files: `prettier --write`

## Architecture Conventions

### Adding a new app

1. Create a directory under `apps/`
2. Add the app to `pnpm-workspace.yaml` (already includes `apps/*`)
3. Use shared configs: extend `@fin-folio/tsconfig/node.json` or `@fin-folio/tsconfig/react.json` for tsconfig, import from `@fin-folio/eslint-config` for ESLint
4. Add `build`, `dev`, `lint`, `typecheck`, and `test` scripts to `package.json` so Turborepo can orchestrate them
5. Add an `.env.example` and register it in `scripts/setup.mjs` `envFiles` array

### Adding a new shared package

1. Create a directory under `packages/`
2. Name the package `@fin-folio/<name>` in `package.json`
3. Reference it from apps using `"@fin-folio/<name>": "workspace:*"`
4. Build output goes to `dist/` (tsc with `rootDir: ./src`)
5. Include an `AGENTS.md` with package-specific documentation

### Adding a new service

1. Create a directory under `services/`
2. Follow the same conventions as apps

### Database Conventions

- All schemas live in `packages/db/src/schemas/` organised by domain subdirectory (e.g. `identity/`, `banking/`)
- Each schema domain has its own `index.ts` and `relations.ts`
- Migrations are **never** run on NestJS app startup — always run explicitly via `pnpm db:migrate`
- Always commit generated migration SQL files (`packages/db/drizzle/`) alongside schema changes
- Use `DbModule.forRoot()` from `@fin-folio/db/nestjs` in `AppModule` for lifecycle-managed DB access

### NestJS Backend Conventions

- One module per domain feature
- Controllers handle HTTP, services handle business logic
- Use dependency injection via constructor parameters
- Inject the database with `@Inject(DB) private readonly db: Db` (token from `@fin-folio/db/nestjs`)
- Place e2e tests in `tests/`, unit tests in `__tests__/` alongside source files as `*.spec.ts`

### React Frontend Conventions

- Vite handles bundling; TypeScript is type-check only (`noEmit: true`)
- Component files use `.tsx` extension
- Place components in feature-based directories under `src/`
