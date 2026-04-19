import type { DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { Global, Inject, Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { createDb } from '../client';
import { DB, DB_POOL } from './tokens';

export interface DbModuleConfig {
  /** PostgreSQL connection string, e.g. `postgresql://user:pass@host/db` */
  databaseUrl: string;
}

/**
 * Global NestJS module that creates a single Drizzle DB client and pg Pool.
 * Register once in `AppModule` via `DbModule.forRoot({ databaseUrl: ... })`.
 *
 * Exports the `DB` token — inject in services with `@Inject(DB) private readonly db: Db`.
 *
 * Gracefully closes the pg.Pool on app shutdown via `onModuleDestroy`.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * DbModule.forRoot({ databaseUrl: process.env.DATABASE_URL! })
 *
 * // any.service.ts
 * constructor(@Inject(DB) private readonly db: Db) {}
 * ```
 */
@Global()
@Module({})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  static forRoot(config: DbModuleConfig): DynamicModule {
    const { db, pool } = createDb(config.databaseUrl);

    return {
      module: DbModule,
      providers: [
        { provide: DB, useValue: db },
        { provide: DB_POOL, useValue: pool },
      ],
      exports: [DB],
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
