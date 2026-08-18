import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode, Patch, Post,
  Req, Res, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';
import { StartAuthDto } from './dto/start-auth.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserJwtAuthGuard } from './guards/user-jwt.guard';

const isProd = process.env.NODE_ENV === 'production';
const SAME_SITE = isProd ? 'none' as const : 'lax' as const;

// Distinct cookie names from the admin cookies (`tch_token` / `tch_refresh` /
// `csrf_token`) — lets one browser hold an admin session AND a user session
// at the same time without collision.
const USER_TOKEN = 'tch_user_token';
const USER_REFRESH = 'tch_user_refresh';
const USER_CSRF = 'csrf_user_token';

function cookieBase() {
  return { httpOnly: true, secure: isProd, sameSite: SAME_SITE };
}
function csrfBase(maxAge: number) {
  return { httpOnly: false, secure: isProd, sameSite: SAME_SITE, maxAge };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly mail: MailService,
  ) {}

  // ── Auth: start (send OTP) ─────────────────────────────────────────────────
  // 3/min matches OtpController and is sized for "user fat-fingers the email"
  // not "attacker hammers signups". Email-level throttling lives in OtpService.
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('start-auth')
  @HttpCode(200)
  async startAuth(@Body() dto: StartAuthDto) {
    await this.users.startAuth(dto.email);
    // Intentional: identical response shape whether user exists or not — prevents
    // email enumeration via this endpoint.
    return { message: 'If the address is valid, an OTP has been sent.' };
  }

  // ── Auth: verify OTP → issue session cookies ───────────────────────────────
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.users.verifyOtp(dto.email, dto.code, dto.name, dto.ref_code);

    res.cookie(USER_TOKEN, result.token, { ...cookieBase(), maxAge: result.accessExpiryMs });
    res.cookie(USER_REFRESH, result.refreshToken, { ...cookieBase(), maxAge: result.refreshExpiryMs });
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(USER_CSRF, csrfToken, csrfBase(result.accessExpiryMs));

    // Fire-and-forget welcome email on first signup. Don't await — keeps p95
    // verify latency low; MailService swallows its own errors.
    if (result.isNewUser && result.user.email_opt_in) {
      this.mail.sendUserWelcome({
        email: result.user.email,
        name: result.user.name,
      }).catch(() => undefined);
    }

    return {
      user: result.user,
      isNewUser: result.isNewUser,
      // CSRF must travel in the body — cross-domain JS can't read the cookie
      csrfToken,
    };
  }

  // ── Auth: refresh access token ─────────────────────────────────────────────
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[USER_REFRESH];
    if (!raw) throw new UnauthorizedException('No refresh token');

    const { token, refreshToken, accessExpiryMs, refreshExpiryMs } = await this.users.refresh(raw);
    res.cookie(USER_TOKEN, token, { ...cookieBase(), maxAge: accessExpiryMs });
    res.cookie(USER_REFRESH, refreshToken, { ...cookieBase(), maxAge: refreshExpiryMs });
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(USER_CSRF, csrfToken, csrfBase(accessExpiryMs));
    return { success: true, csrfToken };
  }

  // ── Auth: logout ───────────────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // CSRF check — prevents a malicious site from force-logging-out a user
    if (req.cookies?.[USER_TOKEN]) {
      const csrfHeader = req.headers['x-csrf-token'] as string;
      const csrfCookie = req.cookies?.[USER_CSRF];
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }
    await this.users.logout(req.cookies?.[USER_REFRESH]);
    res.clearCookie(USER_TOKEN, { ...cookieBase(), maxAge: 0 });
    res.clearCookie(USER_REFRESH, { ...cookieBase(), maxAge: 0 });
    res.clearCookie(USER_CSRF, { ...csrfBase(0) });
    return { success: true };
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  @UseGuards(UserJwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    // Phase 2 enrichment — includes streak + recent badges so navbar can render
    // engagement chips on initial load without a second round-trip.
    return this.users.getMeWithEngagement((req as any).user.sub);
  }

  @UseGuards(UserJwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile((req as any).user.sub, dto);
  }

  @UseGuards(UserJwtAuthGuard)
  @Delete('me')
  @HttpCode(200)
  async deleteAccount(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.users.deleteAccount((req as any).user.sub);
    res.clearCookie(USER_TOKEN, { ...cookieBase(), maxAge: 0 });
    res.clearCookie(USER_REFRESH, { ...cookieBase(), maxAge: 0 });
    res.clearCookie(USER_CSRF, { ...csrfBase(0) });
    return { success: true };
  }
}
