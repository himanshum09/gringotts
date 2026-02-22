import type { Logger as PinoLogger } from 'pino';
import type { ILogger, LogLevel, O11yModuleConfig } from '../types.js';

export type LogMeta = Record<string, unknown>;

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Context-aware logger service wrapping a Pino child logger.
 *
 * Features:
 * - Includes class name (and optionally method name) in every log line
 * - Respects per-class log level configuration from O11yConfig
 * - `forMethod()` creates cached child loggers for method-level context
 *
 * Inject via `LoggerFactory` in NestJS services.
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
 *
 *   async create() {
 *     this.logger.info('Creating transaction', { amount: 100 });
 *     // => { context: 'TransactionService', msg: 'Creating transaction', amount: 100, ... }
 *   }
 * }
 * ```
 */
export class LoggerService implements ILogger {
  private readonly effectiveLevel: number;
  private readonly methodCache = new Map<string, LoggerService>();

  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly config: O11yModuleConfig,
    private readonly context: string,
    private readonly method?: string,
  ) {
    this.effectiveLevel = LEVELS[this.resolveLevel()] ?? LEVELS.info;
  }

  /**
   * Resolve log level with priority:
   * 1. Per-class override from config.logging.levels
   * 2. Global level from config.logging.level
   * 3. Default: 'info'
   */
  private resolveLevel(): LogLevel {
    const classLevel = this.config.logging?.levels?.[this.context];
    if (classLevel) return classLevel;

    const globalLevel = this.config.logging?.level;
    if (globalLevel && globalLevel in LEVELS) return globalLevel;

    return 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= this.effectiveLevel;
  }

  /**
   * Create (or retrieve cached) child logger for a specific method.
   *
   * @example
   * ```typescript
   * const log = this.logger.forMethod('create');
   * log.debug('Validating input');
   * // => { context: 'TransactionService', method: 'create', msg: 'Validating input', ... }
   * ```
   */
  forMethod(methodName: string): LoggerService {
    const cached = this.methodCache.get(methodName);
    if (cached) return cached;

    const logger = new LoggerService(
      this.pinoLogger.child({ context: this.context, method: methodName }),
      this.config,
      this.context,
      methodName,
    );
    this.methodCache.set(methodName, logger);
    return logger;
  }

  private enrichMeta(meta?: LogMeta): LogMeta {
    const enriched: LogMeta = { context: this.context, ...meta };
    if (this.method) enriched.method = this.method;
    return enriched;
  }

  debug(message: string, meta?: LogMeta): void {
    if (this.shouldLog('debug')) {
      this.pinoLogger.debug(this.enrichMeta(meta), message);
    }
  }

  info(message: string, meta?: LogMeta): void {
    if (this.shouldLog('info')) {
      this.pinoLogger.info(this.enrichMeta(meta), message);
    }
  }

  warn(message: string, meta?: LogMeta): void {
    if (this.shouldLog('warn')) {
      this.pinoLogger.warn(this.enrichMeta(meta), message);
    }
  }

  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    if (this.shouldLog('error')) {
      this.pinoLogger.error(
        {
          ...this.enrichMeta(meta),
          err: error instanceof Error ? error : { message: String(error) },
        },
        message,
      );
    }
  }

  log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (this.shouldLog(level)) {
      this.pinoLogger[level](this.enrichMeta(meta), message);
    }
  }
}
