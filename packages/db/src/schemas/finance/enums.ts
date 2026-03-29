import { pgEnum } from 'drizzle-orm/pg-core';

export const financialAccountTypeEnum = pgEnum('financial_account_type', [
  'savings_account',
  'current_account',
  'credit_card',
  'wallet',
  'investment',
  'loan',
]);

export type FinancialAccountType = (typeof financialAccountTypeEnum.enumValues)[number];
