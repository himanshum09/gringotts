import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContext } from '../types.js';

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a callback within a given request context.
 * The context is automatically inherited by all async operations inside `fn`.
 *
 * @example
 * ```typescript
 * runWithContext({ requestId: '123', contextType: 'public' }, () => {
 *   // All logs inside here will have request_id: '123'
 *   next();
 * });
 * ```
 */
export const runWithContext = <T>(ctx: RequestContext, fn: () => T): T => {
  return storage.run(ctx, fn);
};

/**
 * Get the current request context from AsyncLocalStorage.
 * Returns `undefined` if called outside a request context (e.g. during app bootstrap).
 */
export const getContext = (): RequestContext | undefined => {
  return storage.getStore();
};

/**
 * Merge additional fields into the current request context.
 * Useful for enriching the context after authentication (e.g. adding userId).
 *
 * @example
 * ```typescript
 * updateContext({ userId: user.id, contextType: 'authenticated' });
 * ```
 */
export const updateContext = (partial: Partial<RequestContext>): void => {
  const store = storage.getStore();
  if (store) {
    Object.assign(store, partial);
  }
};

/** Direct access to the underlying AsyncLocalStorage instance. */
export { storage as asyncLocalStorage };
