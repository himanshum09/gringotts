import { boolean, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../utils/uuidv7.js';
import { userIdentity } from '../identity/user-identity.js';
import { financialAccountTypeEnum } from './enums.js';

export const financialAccount = pgTable(
  'financial_accounts',
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
    name: text('name').notNull(),
    type: financialAccountTypeEnum('type').notNull(),
    currency: text('currency').notNull(),
    creditLimit: numeric('credit_limit', { precision: 18, scale: 2 }), // nullable, only for credit_card type
    balance: numeric('balance', { precision: 18, scale: 2 }).notNull().default('0.00'), // negative for the owed money (loan, credit_card)
    institutionName: text('institution_name'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [index('idx_financial_accounts_user_identity_id').on(table.userIdentityId)],
);

export type FinancialAccount = typeof financialAccount.$inferSelect;
export type NewFinancialAccount = typeof financialAccount.$inferInsert;
