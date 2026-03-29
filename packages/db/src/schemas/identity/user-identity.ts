import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../utils/uuidv7.js';

export const userIdentity = pgTable(
  'user_identities',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text('email').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [uniqueIndex('uq_user_identities_email').on(table.email)],
);

export type UserIdentity = typeof userIdentity.$inferSelect;
export type NewUserIdentity = typeof userIdentity.$inferInsert;
