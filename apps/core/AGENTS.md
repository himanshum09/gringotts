# `apps/core` — NestJS Backend API

## Overview

The NestJS backend application for Fin-Folio. Provides the REST API layer, wired to Postgres via
`@fin-folio/db` and structured logging via `@fin-folio/o11y`.

## Structure

```
apps/core/
├── src/
│   ├── main.ts              # Bootstrap — creates NestJS app, sets port
│   ├── app.module.ts        # Root module — registers all global modules
│   ├── app.controller.ts    # Root controller (health check)
│   ├── app.service.ts       # Root service
│   └── config/
│       ├── configuration.ts # NestJS ConfigModule loader — parses + validates env
│       └── env.schema.ts    # Zod schema validating all required env variables
├── tests/                   # E2E tests
│   └── app.e2e-spec.ts
└── .env.example             # Env template — copied to .env.local by `pnpm run setup`
```

## Global Modules registered in `AppModule`

| Module         | Source                   | What it provides                                              |
| -------------- | ------------------------ | ------------------------------------------------------------- |
| `ConfigModule` | `@nestjs/config`         | Typed config via `ConfigService`, loads `.env.local` / `.env` |
| `DbModule`     | `@fin-folio/db/nestjs`   | Global Drizzle DB client — inject with `@Inject(DB)`          |
| `O11yModule`   | `@fin-folio/o11y/nestjs` | Structured Pino logging, request IDs, exception filter        |

## Environment Variables

All variables are validated at startup by `src/config/env.schema.ts` (Zod). The app will refuse
to start if any required variable is missing or invalid.

| Variable       | Required | Default | Description                             |
| -------------- | -------- | ------- | --------------------------------------- |
| `NODE_ENV`     | yes      | —       | `development` \| `test` \| `production` |
| `PORT`         | no       | `3000`  | HTTP port                               |
| `DATABASE_URL` | yes      | —       | PostgreSQL connection string            |
| `LOG_LEVEL`    | no       | `info`  | `debug` \| `info` \| `warn` \| `error`  |

Local development values live in `apps/core/.env.local` (gitignored, created by `pnpm run setup`):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://finfolio:finfolio@localhost:5433/finfolio
LOG_LEVEL=debug
```

## Key Patterns

- **Modules**: One module per domain feature. Register in the feature module's `@Module()`.
- **Controllers**: HTTP concerns only — request parsing, status codes, response shaping.
- **Services**: Business logic. Annotated `@Injectable()`, injected via constructor.
- **DB injection**: `constructor(@Inject(DB) private readonly db: Db)` — `DB` and `Db` come from `@fin-folio/db/nestjs`.
- **Logging**: Inject `LoggerFactory` from `@fin-folio/o11y/nestjs`, call `.create(ClassName.name)` in the constructor.

## Adding a Feature Module

```bash
# Example: adding an "accounts" module
mkdir -p src/accounts
```

```ts
// src/accounts/accounts.module.ts
import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
```

```ts
// src/accounts/accounts.service.ts
import { Injectable, Inject } from '@nestjs/common';
import type { Db } from '@fin-folio/db';
import { userIdentity } from '@fin-folio/db';
import { DB } from '@fin-folio/db/nestjs';

@Injectable()
export class AccountsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  findAll() {
    return this.db.select().from(userIdentity);
  }
}
```

Then add `AccountsModule` to the `imports` array in `app.module.ts`.

## Testing

- **Unit tests**: `src/**/__tests__/*.spec.ts` — run with `pnpm test`
- **E2E tests**: `tests/*.e2e-spec.ts` — run with `pnpm test:e2e`
- **Coverage**: `pnpm test:cov`

## Commands

```bash
pnpm run dev           # Watch mode (nest start --watch)
pnpm run start:debug   # Debug + watch mode
pnpm run build         # Production build → dist/
pnpm run start:prod    # Run production build
pnpm run test          # Unit tests
pnpm run test:e2e      # E2E tests (requires running Postgres)
pnpm run test:cov      # Coverage report
pnpm run typecheck     # Type-check without emitting
```
