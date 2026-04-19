import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../utils/uuidv7';
import { userAuthAccountProviderEnum } from './enums';
import { userIdentity } from './user-identity';

export const userAuthAccount = pgTable(
  'user_auth_accounts',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userIdentityId: uuid('user_identity_id')
      .references(() => userIdentity.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(),
    provider: userAuthAccountProviderEnum('provider').notNull().default('credentials'),
    providerAccountId: text('provider_account_id'),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('idx_user_auth_accounts_user_identity_id').on(table.userIdentityId),
    uniqueIndex('uq_user_auth_accounts_identity_provider').on(table.userIdentityId, table.provider), // prevent two google accounts on the same user, for example
  ],
);

export type UserAuthAccount = typeof userAuthAccount.$inferSelect;
export type NewUserAuthAccount = typeof userAuthAccount.$inferInsert;
