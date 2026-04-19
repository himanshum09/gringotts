import { sql } from 'drizzle-orm';
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../utils/uuidv7';
import { userIdentity } from '../identity/user-identity';
import { transactionStatusEnum, transactionTypeEnum } from './enums';
import { financialAccount } from './financial-account';
import { transactionCategory } from './transaction-category';

export const transaction = pgTable(
  'transactions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    financialAccountId: uuid('financial_account_id')
      .references(() => financialAccount.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(),
    userIdentityId: uuid('user_identity_id')
      .references(() => userIdentity.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(), // denormalized — avoids joining through financial_accounts for cross-account queries
    categoryId: uuid('category_id').references(() => transactionCategory.id, {
      onUpdate: 'cascade',
      onDelete: 'set null',
    }), // null = uncategorized; set null on category delete keeps transaction intact
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // always positive — direction captured by type
    currency: text('currency').notNull(), // ISO 4217 — may differ from account currency (foreign transactions)
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').notNull().default('posted'), // 'posted' for manual entry; 'pending' for bank imports
    payee: text('payee'), // who paid / received (e.g. 'Swiggy', 'Salary - Acme Corp')
    description: text('description'), // auto-generated or imported description from bank
    note: text('note'), // user's own freeform note
    referenceId: text('reference_id'), // external bank transaction ID — used for deduplication on import
    date: date('date').notNull(), // calendar date of the transaction — user can backdate
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('idx_transactions_financial_account_id').on(table.financialAccountId),
    index('idx_transactions_user_identity_id').on(table.userIdentityId),
    index('idx_transactions_date').on(table.date),
    index('idx_transactions_category_id').on(table.categoryId),
    // Composite: covers "all transactions for account X in date range" — most common query
    index('idx_transactions_account_date').on(table.financialAccountId, table.date),
    // Prevents duplicate rows when importing bank statements
    uniqueIndex('uq_transactions_account_reference_id')
      .on(table.financialAccountId, table.referenceId)
      .where(sql`${table.referenceId} IS NOT NULL`),
  ],
);

export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;
