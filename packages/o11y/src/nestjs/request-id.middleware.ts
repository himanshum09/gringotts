import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithContext } from '../node/context.js';
import type { RequestContext } from '../types.js';

const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * Middleware that assigns a unique request ID to every incoming HTTP request.
 *
 * - Reads `X-Request-Id` from incoming headers (so clients/gateways can pass a correlation ID)
 * - Generates a `randomUUID()` if no header present
 * - Echoes the ID back on the response header
 * - Wraps the entire request in an `AsyncLocalStorage` context so all downstream
 *   logs automatically include `request_id`
 *
 * Applied globally via `O11yModule`.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string | undefined) ?? randomUUID();

    res.setHeader(REQUEST_ID_HEADER, requestId);

    const ctx: RequestContext = {
      requestId,
      contextType: 'public',
    };

    runWithContext(ctx, () => {
      next();
    });
  }
}
