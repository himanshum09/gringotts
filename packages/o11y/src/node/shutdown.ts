import type { Logger } from 'pino';

/**
 * Create a graceful shutdown handler that flushes the Pino logger.
 *
 * Call the returned function from NestJS lifecycle hooks or process signal handlers.
 *
 * @example
 * ```typescript
 * const shutdown = createShutdownHandler(logger);
 * process.on('SIGTERM', () => shutdown());
 * ```
 */
export const createShutdownHandler = (logger: Logger): (() => Promise<void>) => {
  return async () => {
    logger.info('Shutting down — flushing logs...');
    await new Promise<void>(resolve => {
      logger.flush(() => {
        resolve();
      });
    });
  };
};
