# @fin-folio/o11y — Observability Package

Lightweight observability package for the fin-folio monorepo.
Provides Pino structured logging, per-request context via `AsyncLocalStorage`, and a NestJS integration module.

## Entry Points

| Import                   | Use When                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `@fin-folio/o11y`        | Pure TypeScript types only — zero runtime deps. Safe to import anywhere (shared packages, future browser code). |
| `@fin-folio/o11y/node`   | Node.js only — Pino logger factory + `AsyncLocalStorage` context helpers.                                       |
| `@fin-folio/o11y/nestjs` | NestJS apps (`apps/core`) — everything above + `O11yModule`, `LoggerFactory`, middleware, filter, decorators.   |

Each entry re-exports its parent: `nestjs` ⊃ `node` ⊃ root types.

## Structure

```
src/
├── types.ts                      # ILogger, LogLevel, O11yConfig, RequestContext — zero deps
├── index.ts                      # Root entry: re-exports types
├── node.ts                       # Node entry: types + node/
├── nestjs.ts                     # NestJS entry: types + node/ + nestjs/
├── node/
│   ├── context.ts                # AsyncLocalStorage: runWithContext, getContext, updateContext
│   ├── logger.ts                 # createLogger — Pino factory with request context mixin
│   ├── logger.service.ts         # LoggerService — per-class context + level overrides
│   ├── shutdown.ts               # createShutdownHandler — flushes Pino buffer on shutdown
│   └── index.ts
└── nestjs/
    ├── tokens.ts                 # LOGGER, O11Y_CONFIG DI symbols
    ├── o11y.module.ts            # O11yModule.forRoot — @Global NestJS module
    ├── logger.factory.ts         # LoggerFactory — @Injectable, creates cached LoggerService instances
    ├── request-id.middleware.ts  # X-Request-Id header + AsyncLocalStorage context per request
    ├── exception.filter.ts       # GlobalExceptionFilter — structured error logging + HTTP responses
    ├── decorators.ts             # @NoLog(), @HealthEndpoint()
    └── index.ts
```

## Usage

### NestJS app (`apps/core`)

```typescript
// app.module.ts
import { O11yModule } from '@fin-folio/o11y/nestjs';

@Module({
  imports: [
    O11yModule.forRoot({
      serviceName: 'fin-folio-core',
      environment: process.env.NODE_ENV,
      logging: {
        level: 'info',
        // Pretty-print in development
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
      ignorePaths: ['/health'],
    }),
  ],
})
export class AppModule {}

// any.service.ts
import { Injectable } from '@nestjs/common';
import { LoggerFactory, LoggerService } from '@fin-folio/o11y/nestjs';

@Injectable()
export class TransactionService {
  private readonly logger: LoggerService;

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(TransactionService.name);
  }

  async createTransaction() {
    this.logger.info('Creating transaction', { amount: 100, currency: 'USD' });
    // => { context: 'TransactionService', msg: 'Creating transaction', amount: 100, request_id: '...', ... }
  }
}
```

### Enrich context after authentication

After verifying a JWT (e.g. in a Guard), call `updateContext()` to attach the user ID:

```typescript
import { updateContext } from '@fin-folio/o11y/node';

// In your AuthGuard:
updateContext({ userId: user.id, contextType: 'authenticated' });
// All subsequent logs in this request will include user_id automatically
```

### Shared packages (types only)

```typescript
import type { ILogger } from '@fin-folio/o11y';
```

## Key Concepts

- **`RequestContext`**: `{ requestId, userId?, contextType: 'authenticated' | 'public' }` — automatically injected into every log line
- **`RequestIdMiddleware`**: Sets `X-Request-Id` header + starts `AsyncLocalStorage` context for each request
- **`LoggerFactory`**: Creates one Pino child logger per class, cached for the lifetime of the module
- **`GlobalExceptionFilter`**: Catches all unhandled exceptions, logs them, returns structured HTTP error response

## Commands

```bash
pnpm --filter @fin-folio/o11y build       # Build dist/
pnpm --filter @fin-folio/o11y dev         # Watch mode
pnpm --filter @fin-folio/o11y lint        # Lint
pnpm --filter @fin-folio/o11y typecheck   # Type-check
pnpm --filter @fin-folio/o11y test        # Run tests
```
