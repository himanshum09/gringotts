import { relations } from 'drizzle-orm';
import { userIdentity } from '../identity/user-identity';
import { financialAccount } from './financial-account';
import { transactionCategory } from './transaction-category';
import { transaction } from './transaction';

export const financialAccountRelations = relations(financialAccount, ({ one, many }) => ({
  userIdentity: one(userIdentity, {
    fields: [financialAccount.userIdentityId],
    references: [userIdentity.id],
  }),
  transactions: many(transaction),
}));

export const transactionCategoryRelations = relations(transactionCategory, ({ one, many }) => ({
  // The user who created this category — null for system categories
  userIdentity: one(userIdentity, {
    fields: [transactionCategory.userIdentityId],
    references: [userIdentity.id],
  }),
  // Self-referencing: the parent category (e.g. 'Food' is parent of 'Restaurants')
  parentCategory: one(transactionCategory, {
    fields: [transactionCategory.parentCategoryId],
    references: [transactionCategory.id],
    relationName: 'categoryHierarchy',
  }),
  // Self-referencing: all direct children of this category
  childCategories: many(transactionCategory, {
    relationName: 'categoryHierarchy',
  }),
  transactions: many(transaction),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  financialAccount: one(financialAccount, {
    fields: [transaction.financialAccountId],
    references: [financialAccount.id],
  }),
  userIdentity: one(userIdentity, {
    fields: [transaction.userIdentityId],
    references: [userIdentity.id],
  }),
  category: one(transactionCategory, {
    fields: [transaction.categoryId],
    references: [transactionCategory.id],
  }),
}));
