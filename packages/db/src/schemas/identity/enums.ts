import { pgEnum } from 'drizzle-orm/pg-core';

export const userAuthAccountProviderEnum = pgEnum('user_auth_account_provider', [
  'credentials',
  'google',
  'github',
  'microsoft',
]);

export type UserAuthAccountProviderType = (typeof userAuthAccountProviderEnum.enumValues)[number];
