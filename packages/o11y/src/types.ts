/**
 * Cross-platform logger interface.
 * Implementations: LoggerService (node), future BrowserLogger (browser).
 */
export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggingConfig {
  level?: LogLevel;
  /** Dev-mode pretty printing. Set transport target to 'pino-pretty'. */
  transport?: {
    target: string;
    options?: Record<string, unknown>;
  };
  /**
   * Per-class log level overrides.
   * Keys are class names (e.g. 'TransactionService').
   * @example { 'TransactionService': 'debug', 'HealthController': 'warn' }
   */
  levels?: Record<string, LogLevel>;
}

export interface O11yConfig {
  serviceName: string;
  environment?: string;
  logging?: LoggingConfig;
}

/**
 * Request context stored in AsyncLocalStorage.
 * Automatically injected into every log line.
 */
export interface RequestContext {
  requestId: string;
  /** Authenticated user ID, if the request is authenticated. */
  userId?: string;
  contextType: 'authenticated' | 'public';
  [key: string]: unknown;
}

export interface O11yModuleConfig extends O11yConfig {
  /** Skip automatic HTTP access logging for these URL paths. Defaults to ['/health']. */
  ignorePaths?: string[];
}
