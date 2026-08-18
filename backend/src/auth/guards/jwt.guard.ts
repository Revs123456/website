import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // S3: Read token from HttpOnly cookie, fallback to Authorization header
    const cookieToken = request.cookies?.tch_token;
    const authHeader = request.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) throw new UnauthorizedException();

    // S4: Validate CSRF token on state-changing requests (cookie-based auth only)
    if (cookieToken && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
      const csrfHeader = request.headers['x-csrf-token'];
      const csrfCookie = request.cookies?.csrf_token;
      const tokensMatch = csrfHeader && csrfCookie &&
        csrfHeader.length === csrfCookie.length &&
        crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(csrfCookie));
      if (!tokensMatch) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not set'); })());
      // Defense-in-depth: now that we issue end-user JWTs too, reject anything
      // that isn't explicitly an admin token. Cookie separation alone wouldn't
      // protect against a user JWT replayed via the Authorization header path.
      if (payload?.role !== 'admin') throw new UnauthorizedException();
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
