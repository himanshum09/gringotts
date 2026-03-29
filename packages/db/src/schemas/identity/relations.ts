import { relations } from 'drizzle-orm';
import { userIdentity } from './user-identity.js';
import { session } from './session.js';
import { userAuthAccount } from './user-auth-account.js';

export const userIdentityRelations = relations(userIdentity, ({ many }) => ({
  sessions: many(session),
  authAccounts: many(userAuthAccount),
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
