import type { DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { createLogger } from '../node/logger.js';
import { createShutdownHandler } from '../node/shutdown.js';
import type { O11yModuleConfig } from '../types.js';
import { GlobalExceptionFilter } from './exception.filter.js';
import { LoggerFactory } from './logger.factory.js';
import { RequestIdMiddleware } from './request-id.middleware.js';
import { LOGGER, O11Y_CONFIG } from './tokens.js';

/**
 * Global NestJS observability module. Register once in `AppModule`.
 *
 * What it sets up automatically:
 * - Pino logger bound to the DI container (`LOGGER` token)
 * - `nestjs-pino` HTTP access logging (auto-skips health/ignored paths)
 * - `RequestIdMiddleware` — assigns `X-Request-Id` + `AsyncLocalStorage` context per request
 * - `GlobalExceptionFilter` — structured error logging + consistent HTTP error responses
 * - `LoggerFactory` — injectable factory for per-class loggers
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { O11yModule } from '@fin-folio/o11y/nestjs';
 *
 * @Module({
 *   imports: [
 *     O11yModule.forRoot({
 *       serviceName: 'fin-folio-core',
 *       environment: process.env.NODE_ENV,
 *       logging: {
 *         level: 'info',
 *         transport: process.env.NODE_ENV !== 'production'
 *           ? { target: 'pino-pretty' }
 *           : undefined,
 *       },
 *       ignorePaths: ['/health', '/metrics'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class O11yModule implements NestModule, OnModuleDestroy {
  private static shutdownHandler: (() => Promise<void>) | undefined;

  static forRoot(config: O11yModuleConfig): DynamicModule {
    const logger = createLogger(config);
    O11yModule.shutdownHandler = createShutdownHandler(logger);

    const ignorePaths = config.ignorePaths ?? ['/health'];

    return {
      module: O11yModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            logger,
            autoLogging: {
              ignore(req) {
                const url = (req as unknown as { originalUrl?: string }).originalUrl ?? req.url;
                return ignorePaths.some(p => url === p || url?.startsWith(`${p}/`));
              },
            },
          },
        }),
      ],
      providers: [
        { provide: O11Y_CONFIG, useValue: config },
        { provide: LOGGER, useValue: logger },
        LoggerFactory,
        GlobalExceptionFilter,
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
      ],
      exports: [LOGGER, O11Y_CONFIG, LoggerFactory],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }

  async onModuleDestroy(): Promise<void> {
    if (O11yModule.shutdownHandler) {
      await O11yModule.shutdownHandler();
    }
  }
}
