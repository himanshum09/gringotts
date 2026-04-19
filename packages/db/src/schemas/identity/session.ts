import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../utils/uuidv7';
import { userIdentity } from './user-identity';

export const session = pgTable(
  'sessions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userIdentityId: uuid('user_identity_id')
      .references(() => userIdentity.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    absoluteExpiryMinutes: integer('absolute_expiry_minutes').notNull(),
    inactivityTimeoutMinutes: integer('inactivity_timeout_minutes').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('idx_sessions_user_identity_id').on(table.userIdentityId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
