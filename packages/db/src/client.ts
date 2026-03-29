import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas/index.js';

export type Db = NodePgDatabase<typeof schema>;

/**
 * Create a Drizzle DB client connected to the given DATABASE_URL.
 * Returns both the client and the underlying pool (for graceful shutdown).
 */

export const createDb = (databaseUrl: string): { db: Db; pool: Pool } => {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
  });

  const db = drizzle(pool, { schema });

  return { db, pool };
};
