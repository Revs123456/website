import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

// Best-effort human identifier for whatever a write affected — tried against
// the handler's response first (usually the created/updated/deleted row —
// see the service `remove()` methods, which were changed to return the
// deleted row instead of a bare `{deleted:true}` specifically so this has
// something to read), then the request body as a fallback for POST/PATCH.
function extractLabel(obj: any): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  // "title @ company" (jobs) reads better than either field alone.
  if (typeof obj.title === 'string' && typeof obj.company === 'string') return `${obj.title} @ ${obj.company}`;
  if (typeof obj.name === 'string' && typeof obj.company === 'string') return `${obj.name} @ ${obj.company}`;
  const fields = ['title', 'name', 'question', 'quote', 'tip', 'company', 'role', 'email', 'customer_email', 'admin_email'];
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 120);
  }
  return undefined;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, user, body } = request;

    // Only log admin write actions — end-user writes (profile updates, etc.)
    // would flood the audit log and dilute its security-review value.
    if (!user || user.role !== 'admin' || !['POST', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const label = extractLabel(response) ?? extractLabel(body);
        this.auditService.log({ admin_email: user.email, method, path, label });
      }),
    );
  }
}
