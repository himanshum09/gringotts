# `@fin-folio/db`

## What this package is

The `@fin-folio/db` package is the **single source of truth for all database concerns** in `fin-folio`.

It owns:

- **Drizzle ORM schemas** — TypeScript definitions of every table, organised by domain
- **Drizzle Kit config** — CLI config for generating and running migrations
- **DB client factory** — `createDb()` creates the typed Drizzle client + `pg.Pool`
- **NestJS `DbModule`** — global NestJS module providing the DB client via DI
- **Branded ID types** — type-safe wrappers around raw `string` entity IDs

Consumers (`apps/core`, future services) import from this package. They never define schemas or create pools themselves.

---

## Package structure

```
packages/db/
├── drizzle.config.ts        # Drizzle Kit CLI config (reads from dist/, not src/)
├── drizzle/                 # Generated migration SQL files (git-tracked)
├── src/
│   ├── index.ts             # Main entry point — re-exports everything public
│   ├── client.ts            # createDb() factory — Drizzle client + pg.Pool
│   ├── types.ts             # Branded ID types (UserId, AccountId, etc.)
│   ├── utils/
│   │   ├── uuidv7.ts        # UUIDv7 generator used as $defaultFn in schemas
│   │   └── generate-unique-string.ts
│   ├── nestjs/              # NestJS integration (exported via ./nestjs subpath)
│   │   ├── db.module.ts     # DbModule — global NestJS module
│   │   ├── tokens.ts        # DB and DB_POOL injection tokens
│   │   └── index.ts         # Barrel: DbModule, DB token, DbModuleConfig
│   └── schemas/
│       ├── index.ts         # Re-exports all domain schemas + relations
│       └── identity/        # Auth domain: user_identities, sessions
│           ├── user-identity.ts
│           ├── session.ts
│           ├── relations.ts
│           └── index.ts
├── tsconfig.json            # TypeScript config (extends @fin-folio/tsconfig/node.json)
└── tsconfig.build.json      # Redundant now — tsconfig.json already emits declarations
```

---

## Schema organisation

Schemas are organised into domain subdirectories under `src/schemas/`. Each domain has:

| File           | Purpose                                      |
| -------------- | -------------------------------------------- |
| `<entity>.ts`  | Table definition + inferred TypeScript types |
| `relations.ts` | Drizzle `relations()` for this domain        |
| `index.ts`     | Barrel — re-exports tables, types, relations |

### Current domains

| Domain      | Tables                        |
| ----------- | ----------------------------- |
| `identity/` | `user_identities`, `sessions` |

### Adding a new domain

1. Create `src/schemas/<domain>/` directory
2. Add table files, `relations.ts`, and `index.ts`
3. Re-export from `src/schemas/index.ts`

Example — adding a `banking` domain:

```ts
// src/schemas/banking/account.ts
import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { userIdentity } from '../identity/user-identity.js';
import { uuidv7 } from '../../utils/uuidv7.js';

export const account = pgTable('accounts', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userIdentityId: uuid('user_identity_id')
    .notNull()
    .references(() => userIdentity.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  name: text('name').notNull(),
  balance: numeric('balance', { precision: 18, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
```

```ts
// src/schemas/banking/relations.ts
import { relations } from 'drizzle-orm';
import { userIdentity } from '../identity/user-identity.js';
import { account } from './account.js';

export const accountRelations = relations(account, ({ one }) => ({
  userIdentity: one(userIdentity, {
    fields: [account.userIdentityId],
    references: [userIdentity.id],
  }),
}));
```

```ts
// src/schemas/banking/index.ts
export * from './account.js';
export * from './relations.js';
```

```ts
// src/schemas/index.ts — add the new domain
export * from './identity/index.js';
export * from './banking/index.js'; // ← add this
```

### Schema design rules

- All primary keys: `uuid` using `uuidv7()` as `$defaultFn`
- All timestamps: `withTimezone: true`
- Column names: `snake_case` in DB, `camelCase` in TypeScript
- FK references: always specify `onDelete` and `onUpdate` actions explicitly
  - Ownership FK (child owned by parent): `{ onDelete: 'cascade', onUpdate: 'cascade' }`
  - Optional/soft reference: `{ onDelete: 'set null' }`
- Indexes: add `index()` on every FK column and frequently-filtered columns
- Use `uniqueIndex('constraint_name').on(table.col)` for named unique constraints

---

## NestJS integration (`./nestjs` subpath)

`DbModule` creates a single `pg.Pool` and wraps it in a typed Drizzle client, registered globally.
Register **once** in `AppModule`:

```ts
// apps/core/src/app.module.ts
import { DbModule } from '@fin-folio/db/nestjs';

@Module({
  imports: [
    DbModule.forRoot({
      databaseUrl: process.env.DATABASE_URL!,
    }),
  ],
})
export class AppModule {}
```

Inject in any service:

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { Db } from '@fin-folio/db';
import { userIdentity } from '@fin-folio/db';
import { DB } from '@fin-folio/db/nestjs';

@Injectable()
export class UsersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  findAll() {
    return this.db.select().from(userIdentity);
  }
}
```

`DbModule` gracefully closes the `pg.Pool` via `onModuleDestroy` when the app shuts down —
no manual cleanup needed.

---

## DB client (without NestJS)

For scripts, seeds, or tests that run outside NestJS:

```ts
import { createDb } from '@fin-folio/db';

const { db, pool } = createDb(process.env.DATABASE_URL!);

// Use db for queries...

// Close the pool when done
await pool.end();
```

---

## Branded ID types

Prevent passing the wrong ID type at compile time:

```ts
import { toUserId, type UserId } from '@fin-folio/db';

function findUser(id: UserId) { ... }

findUser(toUserId(rawString));  // ✅
findUser(rawString);            // ❌ TypeScript error
```

Use `to*` converters only at system boundaries — HTTP request params, external API responses, DB rows read without Drizzle typing.

---

## Migration workflow

> `db:generate` and `db:migrate` automatically run `pnpm build` first because `drizzle.config.ts`
> points at `dist/` (compiled output), not `src/`. This ensures drizzle-kit always reads the
> latest schema.

### Generating a migration

Always pass `--name` to give the migration a meaningful filename instead of the random default:

```bash
pnpm run db:generate -- --name <description>
```

**Examples:**

```bash
pnpm run db:generate -- --name create_accounts_table
pnpm run db:generate -- --name add_avatar_url_to_users
pnpm run db:generate -- --name add_idx_sessions_expires_at
pnpm run db:generate -- --name drop_legacy_tokens_table
```

**Naming convention:** lowercase with underscores, verb first:

| Verb      | Use                              |
| --------- | -------------------------------- |
| `create_` | New table                        |
| `add_`    | New column, index, or constraint |
| `drop_`   | Remove table, column, or index   |
| `rename_` | Rename table or column           |
| `alter_`  | Change column type or default    |

### Applying migrations

```bash
# Apply pending migrations to local DB:
pnpm run db:migrate                          # from monorepo root
pnpm --filter @fin-folio/db run db:migrate   # equivalent, from anywhere

# Inspect DB visually:
pnpm --filter @fin-folio/db run db:studio

# Push schema directly (dev only — skips migration file generation):
pnpm --filter @fin-folio/db run db:push
```

`DATABASE_URL` is read from `packages/db/.env` (created by `pnpm run setup` from `.env.example`).

### What to commit

Always commit these files alongside every schema change:

```
packages/db/drizzle/0001_your_migration_name.sql   ← the SQL itself
packages/db/drizzle/meta/0001_snapshot.json        ← drizzle-kit's state snapshot
packages/db/drizzle/meta/journal.json              ← migration history index
```

> [!CAUTION]
> Never modify or delete an already-applied migration file. Drizzle tracks applied migrations
> by filename in the `__drizzle_migrations` table. Renaming or deleting a file after it has
> been applied will cause drizzle to re-apply it or error on the next run.

---

## Build

```bash
pnpm --filter @fin-folio/db build      # compile src/ → dist/
pnpm --filter @fin-folio/db typecheck  # type-check without emitting
```

The build must be run before `apps/core` can import `@fin-folio/db/nestjs` — TypeScript resolves
from the compiled `dist/` output, not the source. Run `pnpm build` from the root to build all
packages in the correct dependency order.
