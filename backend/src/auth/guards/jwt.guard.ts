import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const token = authHeader.slice(7);
      request.user = jwt.verify(token, process.env.JWT_SECRET || 'tch-jwt-secret');
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
