import { SetMetadata } from '@nestjs/common';

export const O11Y_NOLOG = 'o11y:nolog';
export const O11Y_HEALTH = 'o11y:health';

/**
 * Suppress automatic HTTP access log for this endpoint.
 * Useful for noisy polling endpoints.
 *
 * @example
 * ```typescript
 * @NoLog()
 * @Get('metrics/poll')
 * poll() { ... }
 * ```
 */
export const NoLog = () => SetMetadata(O11Y_NOLOG, true);

/**
 * Mark this endpoint as a health check.
 * Automatically suppresses access logs (avoids noise from load balancer pings).
 *
 * @example
 * ```typescript
 * @HealthEndpoint()
 * @Get('health')
 * health() { return { status: 'ok' }; }
 * ```
 */
export const HealthEndpoint = () => SetMetadata(O11Y_HEALTH, true);
