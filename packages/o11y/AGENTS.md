# `@fin-folio/o11y`

## What this package is

The `@fin-folio/o11y` package provides **structured observability** for the `fin-folio` monorepo — specifically structured logging with per-request context, powered by [Pino](https://getpino.io).

It has no OpenTelemetry tracing (unlike the atlas equivalent) — fin-folio is a personal app and doesn't need distributed tracing.

It exposes **three entry points**:

| Import path              | What it provides                                     | Who uses it                   |
| ------------------------ | ---------------------------------------------------- | ----------------------------- |
| `@fin-folio/o11y`        | Types and interfaces (`ILogger`, `LogLevel`, etc.)   | Anywhere — framework-agnostic |
| `@fin-folio/o11y/node`   | `LoggerService`, `AsyncLocalStorage` context helpers | Node.js code outside NestJS   |
| `@fin-folio/o11y/nestjs` | `O11yModule`, `LoggerFactory`, decorators, filters   | `apps/core` (NestJS)          |

---

## Package structure

```
packages/o11y/
└── src/
    ├── index.ts             # Re-exports types and node entry
    ├── types.ts             # Shared interfaces: ILogger, LogLevel, RequestContext, etc.
    ├── nestjs.ts            # Re-exports all NestJS-specific exports
    ├── node.ts              # Re-exports all Node.js-specific exports
    ├── node/
    │   ├── context.ts       # AsyncLocalStorage-based request context
    │   ├── logger.ts        # createLogger() — creates a root Pino instance
    │   ├── logger.service.ts # LoggerService — the injectable logger class
    │   ├── shutdown.ts      # Graceful Pino shutdown handler
    │   └── index.ts
    └── nestjs/
        ├── o11y.module.ts   # O11yModule — global NestJS module
        ├── logger.factory.ts # LoggerFactory — creates per-class loggers
        ├── request-id.middleware.ts # Assigns X-Request-Id + AsyncLocalStorage context
        ├── exception.filter.ts # GlobalExceptionFilter — structured error responses
        ├── decorators.ts    # @NoLog(), @HealthEndpoint() route decorators
        ├── tokens.ts        # LOGGER, O11Y_CONFIG injection tokens
        └── index.ts
```

---

## Core concepts

### Structured logging (Pino)

Every log line is a JSON object with consistent fields. In development, `pino-pretty` renders it as human-readable coloured output.

```ts
logger.info('User created', { userId: 'abc-123', email: 'user@example.com' });

// Production output (JSON):
// {"level":"info","time":1234567890,"service":"fin-folio-core","msg":"User created","userId":"abc-123","email":"user@example.com"}

// Development output (pino-pretty):
// INFO  [UserService] User created  userId=abc-123 email=user@example.com
```

### Request context via `AsyncLocalStorage`

`RequestContext` is stored in `AsyncLocalStorage` for the lifetime of an HTTP request. Every log written during that request automatically includes `requestId` and optionally `userId` — **without passing them as function arguments**.

```ts
// Set by RequestIdMiddleware at the start of every request ↓
{ requestId: 'abc-123', contextType: 'public' }

// Updated after authentication ↓
updateContext({ userId: 'user-456', contextType: 'authenticated' });

// All logs from this request inherit context automatically
logger.info('Fetching accounts'); // → includes request_id, user_id
```

---

## `O11yModule` — what it sets up automatically

Register **once** in `AppModule`. It wires up:

| What                    | How                                                                        |
| ----------------------- | -------------------------------------------------------------------------- |
| Pino logger             | Bound to DI via `LOGGER` token                                             |
| HTTP access logging     | Via `nestjs-pino` — every request/response logged automatically            |
| `RequestIdMiddleware`   | Assigns `X-Request-Id` header + starts `AsyncLocalStorage` context         |
| `GlobalExceptionFilter` | Catches all unhandled exceptions, logs them, returns structured error JSON |
| `LoggerFactory`         | Injectable factory for per-class loggers                                   |

```ts
// apps/core/src/app.module.ts
import { O11yModule } from '@fin-folio/o11y/nestjs';

@Module({
  imports: [
    O11yModule.forRoot({
      serviceName: 'fin-folio-core',
      logging: {
        level: 'info', // 'debug' | 'info' | 'warn' | 'error'
        transport: { target: 'pino-pretty' }, // dev only — omit in production
      },
      ignorePaths: ['/health', '/metrics'], // suppress access logs for these paths
    }),
  ],
})
export class AppModule {}
```

---

## `LoggerFactory` — per-class loggers

Inject `LoggerFactory` in any service and call `.create()` once in the constructor. Each class gets its own child logger with a `context` field in every log line.

```ts
import { Injectable } from '@nestjs/common';
import { LoggerFactory } from '@fin-folio/o11y/nestjs';
import type { LoggerService } from '@fin-folio/o11y/node';

@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(UserService.name);
  }

  async findById(id: string) {
    this.logger.info('Finding user', { id });
    // Log output includes: context=UserService, request_id=..., user_id=...
  }
}
```

---

## Route decorators

### `@HealthEndpoint()`

Mark an endpoint as a health check. Semantically signals intent — keeps the code self-documenting.

```ts
import { HealthEndpoint } from '@fin-folio/o11y/nestjs';

@HealthEndpoint()
@Get('health')
getHealth() {
  return { status: 'ok' };
}
```

> **Note:** Access log suppression for `/health` is handled via `ignorePaths` in `O11yModule.forRoot()`. `@HealthEndpoint()` is a semantic marker for now.

### `@NoLog()`

Suppress access logging on a specific noisy endpoint (e.g. a polling route):

```ts
import { NoLog } from '@fin-folio/o11y/nestjs';

@NoLog()
@Get('status/poll')
poll() { ... }
```

---

## Request context helpers (node)

Use these outside NestJS (e.g. in utility scripts or tests):

```ts
import { runWithContext, getContext, updateContext } from '@fin-folio/o11y/node';

// Start a context
runWithContext({ requestId: 'abc', contextType: 'public' }, () => {
  // All async operations inside here share this context
  doSomething();
});

// Read current context (returns undefined if outside a context)
const ctx = getContext();

// Enrich context mid-request (e.g. after authentication)
updateContext({ userId: 'user-123', contextType: 'authenticated' });
```

---

## `ILogger` interface

Use `ILogger` instead of `LoggerService` in function signatures to keep code framework-agnostic and easier to test:

```ts
import type { ILogger } from '@fin-folio/o11y';

function processTransaction(logger: ILogger) {
  logger.info('Processing transaction');
}
```

---

## Types reference

| Type               | Where                  | Purpose                                  |
| ------------------ | ---------------------- | ---------------------------------------- |
| `ILogger`          | `@fin-folio/o11y`      | Framework-agnostic logger interface      |
| `LogLevel`         | `@fin-folio/o11y`      | `'debug' \| 'info' \| 'warn' \| 'error'` |
| `RequestContext`   | `@fin-folio/o11y`      | Shape of the AsyncLocalStorage context   |
| `O11yModuleConfig` | `@fin-folio/o11y`      | Config for `O11yModule.forRoot()`        |
| `LoggerService`    | `@fin-folio/o11y/node` | Concrete Pino-backed logger class        |
