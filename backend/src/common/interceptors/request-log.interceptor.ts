import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Structured per-request logging.
 *   [METHOD path status latency role=admin|user|anon]
 *
 * Skips noisy paths (health probes, OG image) that would flood the log.
 *
 * Phase 7 alternative was a full APM (Datadog/Honeycomb). For solo-founder
 * scale, structured stdout into Render's log viewer is fine — they're
 * grep-able and Render exposes them via API.
 */
@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  private readonly SKIP_PATHS = new Set([
    '/v1/healthz',
    '/v1/readyz',
    '/v1/notifications/unread-count',  // polled every 30s — flooding noise
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = Date.now();
    const path: string = req.originalUrl || req.url;
    const method: string = req.method;

    if (this.SKIP_PATHS.has(path) || path.startsWith('/v1/notifications/unread-count')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const latency = Date.now() - start;
        const role = req.user?.role ?? 'anon';
        const status = res.statusCode;
        // Use logger.log for 2xx/3xx; warn for 4xx; error for 5xx
        const message = `${method} ${path} ${status} ${latency}ms role=${role}`;
        if (status >= 500) this.logger.error(message);
        else if (status >= 400) this.logger.warn(message);
        else this.logger.log(message);
      }),
      catchError((err) => {
        const latency = Date.now() - start;
        const role = req.user?.role ?? 'anon';
        const status = err?.status ?? 500;
        this.logger.error(`${method} ${path} ${status} ${latency}ms role=${role} err=${err?.message || 'unknown'}`);
        return throwError(() => err);
      }),
    );
  }
}
