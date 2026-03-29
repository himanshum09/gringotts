import { relations } from 'drizzle-orm';
import { userIdentity } from '../identity/user-identity.js';
import { financialAccount } from './financial-account.js';

export const financialAccountRelations = relations(financialAccount, ({ one }) => ({
  userIdentity: one(userIdentity, {
    fields: [financialAccount.userIdentityId],
    references: [userIdentity.id],
  }),
}));
