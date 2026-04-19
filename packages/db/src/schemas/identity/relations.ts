import { relations } from 'drizzle-orm';
import { financialAccount } from '../finance/financial-account';
import { transactionCategory } from '../finance/transaction-category';
import { transaction } from '../finance/transaction';
import { session } from './session';
import { userAuthAccount } from './user-auth-account';
import { userIdentity } from './user-identity';

export const userIdentityRelations = relations(userIdentity, ({ many }) => ({
  sessions: many(session),
  authAccounts: many(userAuthAccount),
  financialAccounts: many(financialAccount),
  transactionCategories: many(transactionCategory),
  transactions: many(transaction),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  userIdentity: one(userIdentity, {
    fields: [session.userIdentityId],
    references: [userIdentity.id],
  }),
}));

export const userAuthAccountRelations = relations(userAuthAccount, ({ one }) => ({
  userIdentity: one(userIdentity, {
    fields: [userAuthAccount.userIdentityId],
    references: [userIdentity.id],
  }),
}));
