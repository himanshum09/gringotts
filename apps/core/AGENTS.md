# Fin-Folio Core - NestJS Backend API

## Overview

This is the NestJS backend application for Fin-Folio. It serves as the API layer.

## Structure

```
src/
├── main.ts              # Application bootstrap (port from PORT env or 3000)
├── app.module.ts        # Root module
├── app.controller.ts    # Root controller (health check)
└── app.service.ts       # Root service
test/
├── app.e2e-spec.ts      # End-to-end tests
└── jest-e2e.json        # Jest e2e configuration
```

## Key Patterns

- **Modules**: One module per domain feature. Register controllers and providers in the module's `@Module()` decorator.
- **Controllers**: Handle HTTP concerns only (request parsing, response shaping, status codes). Delegate logic to services.
- **Services**: Business logic lives here. Annotate with `@Injectable()` and inject via constructor.
- **DTOs**: Use class-validator for request validation when adding endpoints.

## Testing

- **Unit tests**: Co-located with source files as `*.spec.ts`. Run with `pnpm run test`.
- **E2E tests**: In `test/` directory. Run with `pnpm run test:e2e`. Use Supertest to make HTTP requests against the running app.
- **Coverage**: Run `pnpm run test:cov` for coverage reports.

## Configuration

- TypeScript extends `@fin-folio/tsconfig/node.json` with NestJS-specific options (decorators, metadata emission)
- ESLint extends `@fin-folio/eslint-config/node.mjs`
- Build output goes to `dist/`

## Development

```bash
pnpm run start:dev    # Watch mode
pnpm run start:debug  # Debug + watch mode
```

The dev server runs on `http://localhost:3000` by default. Set the `PORT` environment variable to change it.
