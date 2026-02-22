import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { Response } from 'express';
import type { Logger } from 'pino';
import { getContext } from '../node/context.js';
import { LOGGER } from './tokens.js';

/**
 * Global exception filter that catches all unhandled exceptions.
 *
 * - `HttpException` → returns its status + response body
 * - Everything else → 500 Internal Server Error
 * - Logs the error with structured fields: `err`, `statusCode`, `request_id`, `user_id`
 *
 * Registered automatically by `O11yModule`.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger;

  constructor(@Inject(LOGGER) rootLogger: Logger) {
    this.logger = rootLogger.child({ context: `o11y/${GlobalExceptionFilter.name}` });
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpCtx = host.switchToHttp();
    const response = httpCtx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : 'Internal server error';

    const ctx = getContext();

    this.logger.error(
      {
        err: exception instanceof Error ? exception : { message: String(exception) },
        statusCode: status,
        request_id: ctx?.requestId,
        user_id: ctx?.userId,
        context_type: ctx?.contextType,
      },
      `Unhandled exception: ${message}`,
    );

    const body = isHttpException
      ? exception.getResponse()
      : { statusCode: status, message: 'Internal server error' };

    response.status(status).json(body);
  }
}
