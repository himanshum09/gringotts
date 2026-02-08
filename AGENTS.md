# Fin-Folio Monorepo

## Project Overview

Fin-Folio is a TypeScript monorepo containing a NestJS backend API and a React frontend application, managed with pnpm workspaces and Turborepo.

## Monorepo Structure

```
fin-folio/
├── apps/
│   ├── core/          # NestJS backend API
│   └── web-app/           # React + Vite frontend
├── packages/
│   ├── eslint-config/ # Shared ESLint configurations (base, node, react)
│   └── tsconfig/      # Shared TypeScript configurations (base, node, react)
├── services/          # Future microservices
├── turbo.json         # Turborepo task pipeline
└── pnpm-workspace.yaml
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 10.x (workspaces)
- **Build Orchestrator**: Turborepo
- **Backend**: NestJS 11, TypeScript 5.7
- **Frontend**: React 19, Vite 7, TypeScript 5.7
- **Testing**: Jest 30 (backend), Supertest (e2e)
- **Linting**: ESLint 9 (flat config), Prettier 3
- **Git Hooks**: Husky + lint-staged

## Commands

Run all commands from the monorepo root unless stated otherwise.

```bash
pnpm run build       # Build all packages and apps
pnpm run dev         # Start all apps in development mode
pnpm run lint        # Lint all packages and apps
pnpm run typecheck   # Type-check all packages and apps
pnpm run test        # Run tests across all packages and apps
```

### App-specific commands (run from within the app directory)

**Backend** (`apps/core`):

```bash
pnpm run start:dev     # Dev server with watch mode
pnpm run start:debug   # Debug mode with watch
pnpm run test          # Unit tests
pnpm run test:e2e      # End-to-end tests
pnpm run test:cov      # Test coverage
```

**Frontend** (`apps/web`):

```bash
pnpm run dev           # Vite dev server with HMR
pnpm run build         # TypeScript compile + Vite production build
pnpm run preview       # Preview production build locally
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

### Adding a new shared package

1. Create a directory under `packages/`
2. Name the package `@fin-folio/<name>` in `package.json`
3. Reference it from apps using `"@fin-folio/<name>": "workspace:*"`

### Adding a new service

1. Create a directory under `services/`
2. Follow the same conventions as apps

### NestJS Backend Conventions

- One module per domain feature
- Controllers handle HTTP, services handle business logic
- Use dependency injection via constructor parameters
- Place e2e tests in `test/`, unit tests alongside source files as `*.spec.ts`

### React Frontend Conventions

- Vite handles bundling; TypeScript is type-check only (`noEmit: true`)
- Component files use `.tsx` extension
- Place components in feature-based directories under `src/`
