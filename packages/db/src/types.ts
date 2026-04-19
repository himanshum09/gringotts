import type { Db } from './client';

// Re-export for convenient consumption across the app
export type { Db };

// Branded ID types (avoids raw string confusion)
export type Brand<T, B> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;

export const toUserId = (id: string): UserId => id as UserId;
export const toSessionId = (id: string): SessionId => id as SessionId;
