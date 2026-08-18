import { Controller, Get, Post, Delete, Body, Param, UseGuards, Res, Req, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

const isProd = process.env.NODE_ENV === 'production';

// SameSite=None required for cross-domain deployments (Vercel frontend + Render API)
// SameSite=None MUST have Secure=true, so in dev (HTTP) fall back to lax
const SAME_SITE = isProd ? 'none' as const : 'lax' as const;

function cookieBase() {
  return { httpOnly: true, secure: isProd, sameSite: SAME_SITE };
}
function csrfBase(maxAge: number) {
  return { httpOnly: false, secure: isProd, sameSite: SAME_SITE, maxAge };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(loginDto);
    let csrfToken: string | undefined;
    if (data.token) {
      const accessMs = data.accessExpiryMs ?? 15 * 60 * 1000;
      const refreshMs = data.refreshExpiryMs ?? 30 * 24 * 60 * 60 * 1000;
      res.cookie('tch_token', data.token, { ...cookieBase(), maxAge: accessMs });
      res.cookie('tch_refresh', data.refreshToken!, { ...cookieBase(), maxAge: refreshMs });
      csrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf_token', csrfToken, csrfBase(accessMs));
    }
    const { token: _t, refreshToken: _r, accessExpiryMs: _a, refreshExpiryMs: _re, ...rest } = data;
    // Return csrfToken in response body — required because cross-domain JS cannot read
    // cookies set by a different origin (even with credentials:include)
    return { ...rest, csrfToken };
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefresh = req.cookies?.tch_refresh;
    if (!rawRefresh) throw new UnauthorizedException('No refresh token');
    const { token, refreshToken, accessExpiryMs, refreshExpiryMs } = await this.authService.refresh(rawRefresh);
    res.cookie('tch_token', token, { ...cookieBase(), maxAge: accessExpiryMs });
    res.cookie('tch_refresh', refreshToken, { ...cookieBase(), maxAge: refreshExpiryMs });
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', csrfToken, csrfBase(accessExpiryMs));
    // Return new CSRF token in body for cross-domain JS access
    return { success: true, csrfToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // CSRF check — prevents forced-logout attacks
    const cookieToken = req.cookies?.tch_token;
    if (cookieToken) {
      const csrfHeader = req.headers['x-csrf-token'] as string;
      const csrfCookie = req.cookies?.csrf_token;
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }
    await this.authService.logout(req.cookies?.tch_refresh);
    res.clearCookie('tch_token', { ...cookieBase(), maxAge: 0 });
    res.clearCookie('tch_refresh', { ...cookieBase(), maxAge: 0 });
    res.clearCookie('csrf_token', { ...csrfBase(0) });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admins')
  listAdmins() {
    return this.authService.listAdmins();
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-admin')
  createAdmin(@Body() body: CreateAdminDto) {
    return this.authService.createAdmin(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string, @Req() req: Request) {
    return this.authService.deleteAdmin(id, (req as any).user?.sub);
  }
}
