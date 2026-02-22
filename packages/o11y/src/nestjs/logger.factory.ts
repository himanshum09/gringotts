import { Inject, Injectable } from '@nestjs/common';
import type { Logger as PinoLogger } from 'pino';
import { LoggerService } from '../node/logger.service.js';
import type { O11yModuleConfig } from '../types.js';
import { LOGGER, O11Y_CONFIG } from './tokens.js';

/**
 * Factory for creating context-aware `LoggerService` instances. Injectable by class reference.
 *
 * Each service should inject `LoggerFactory` and call `create()` once in the constructor.
 * Instances are cached by context name so each class gets a stable child logger.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TransactionService {
 *   private readonly logger: LoggerService;
 *
 *   constructor(loggerFactory: LoggerFactory) {
 *     this.logger = loggerFactory.create(TransactionService.name);
 *   }
 * }
 * ```
 */
@Injectable()
export class LoggerFactory {
  private readonly cache = new Map<string, LoggerService>();

  constructor(
    @Inject(LOGGER) private readonly rootLogger: PinoLogger,
    @Inject(O11Y_CONFIG) private readonly config: O11yModuleConfig,
  ) {}

  /** Create (or retrieve cached) logger for the given class context. */
  create(context: string): LoggerService {
    if (this.cache.has(context)) {
      return this.cache.get(context)!;
    }
    const logger = new LoggerService(this.rootLogger.child({ context }), this.config, context);
    this.cache.set(context, logger);
    return logger;
  }

  /** Create (or retrieve cached) logger scoped to a specific method within a class. */
  createForMethod(context: string, method: string): LoggerService {
    const key = `${context}.${method}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const logger = new LoggerService(
      this.rootLogger.child({ context, method }),
      this.config,
      context,
      method,
    );
    this.cache.set(key, logger);
    return logger;
  }
}
