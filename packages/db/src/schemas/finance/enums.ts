import { pgEnum } from 'drizzle-orm/pg-core';

export const financialAccountTypeEnum = pgEnum('financial_account_type', [
  'savings_account',
  'current_account',
  'credit_card',
  'wallet',
  'investment',
  'loan',
]);

export const transactionTypeEnum = pgEnum('transaction_type', ['debit', 'credit']);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'posted',
  'cancelled',
]);

export type FinancialAccountType = (typeof financialAccountTypeEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type TransactionStatus = (typeof transactionStatusEnum.enumValues)[number];
