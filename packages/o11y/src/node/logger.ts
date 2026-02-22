import type { Logger } from 'pino';
import pino from 'pino';
import type { O11yConfig } from '../types.js';
import { getContext } from './context.js';

/**
 * Create a root Pino logger configured for the service.
 *
 * Automatically mixes in request context (requestId, userId) from
 * AsyncLocalStorage into every log line — no need to pass them manually.
 *
 * @example
 * ```typescript
 * const logger = createLogger({ serviceName: 'fin-folio-core', logging: { level: 'info' } });
 * logger.info('Server started');
 * // { level: 'INFO', service: 'fin-folio-core', msg: 'Server started' }
 * ```
 */
export const createLogger = (config: O11yConfig): Logger => {
  return pino({
    level: config.logging?.level ?? 'info',
    base: {
      service: config.serviceName,
      environment: config.environment ?? process.env.NODE_ENV ?? 'development',
    },
    ...(config.logging?.transport ? { transport: config.logging.transport } : {}),
    mixin() {
      const mixed: Record<string, unknown> = {};

      // Inject request/user context from AsyncLocalStorage into every log line
      const ctx = getContext();
      if (ctx) {
        mixed.request_id = ctx.requestId;
        mixed.context_type = ctx.contextType;
        if (ctx.userId) mixed.user_id = ctx.userId;
      }

      return mixed;
    },
  });
};
