import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

/**
 * Auth guard for end-user routes.
 *
 * Mirrors the admin JwtAuthGuard but:
 *   - reads the user cookie pair (`tch_user_token` / `csrf_user_token`) instead of the admin pair
 *   - rejects tokens whose `role` is not `'user'` — prevents an admin JWT being replayed
 *     against user endpoints (cleaner separation, and lets us tighten policies per role later)
 */
@Injectable()
export class UserJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const cookieToken = request.cookies?.tch_user_token;
    const authHeader = request.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) throw new UnauthorizedException();

    // CSRF defense on state-changing requests when using cookie auth
    if (cookieToken && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
      const csrfHeader = request.headers['x-csrf-token'];
      const csrfCookie = request.cookies?.csrf_user_token;
      const tokensMatch =
        csrfHeader && csrfCookie &&
        csrfHeader.length === csrfCookie.length &&
        crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(csrfCookie));
      if (!tokensMatch) throw new ForbiddenException('Invalid CSRF token');
    }

    try {
      const payload: any = jwt.verify(
        token,
        process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not set'); })(),
      );
      if (payload.role !== 'user') throw new UnauthorizedException();
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
