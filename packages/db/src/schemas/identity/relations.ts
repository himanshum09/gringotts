import { relations } from 'drizzle-orm';
import { userIdentity } from './user-identity.js';
import { session } from './session.js';

export const userIdentityRelations = relations(userIdentity, ({ many }) => ({
  sessions: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  userIdentity: one(userIdentity, {
    fields: [session.userIdentityId],
    references: [userIdentity.id],
  }),
}));
