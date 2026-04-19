import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { uuidv7 } from '../../utils/uuidv7';
import { userIdentity } from '../identity/user-identity';

export const transactionCategory = pgTable(
  'transaction_categories',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userIdentityId: uuid('user_identity_id').references(() => userIdentity.id, {
      onUpdate: 'cascade',
      onDelete: 'cascade',
    }), // null = system category, set = user-defined
    name: text('name').notNull(),
    icon: text('icon'), // emoji or icon identifier e.g. '🍔', 'shopping-cart'
    color: text('color'), // hex color e.g. '#FF6B6B' — for UI color-coding
    isSystem: boolean('is_system').notNull().default(false),
    parentCategoryId: uuid('parent_category_id').references(
      (): AnyPgColumn => transactionCategory.id,
      { onUpdate: 'cascade', onDelete: 'set null' },
    ), // self-referencing — enables subcategories (e.g. Food → Restaurants)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('idx_transaction_categories_user_identity_id').on(table.userIdentityId),
    index('idx_transaction_categories_parent_category_id').on(table.parentCategoryId),
    // System categories: unique by name globally (userIdentityId IS NULL)
    uniqueIndex('uq_transaction_categories_system_name')
      .on(table.name)
      .where(sql`${table.userIdentityId} IS NULL`),
    // User categories: unique by name per user
    uniqueIndex('uq_transaction_categories_user_name')
      .on(table.userIdentityId, table.name)
      .where(sql`${table.userIdentityId} IS NOT NULL`),
  ],
);

export type TransactionCategory = typeof transactionCategory.$inferSelect;
export type NewTransactionCategory = typeof transactionCategory.$inferInsert;
