import { Body, Controller, ForbiddenException, Get, HttpCode, Param, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { MockInterviewService } from './mock-interview.service';
import { StartInterviewDto } from './dto/start-interview.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('mock-interview')
export class MockInterviewController {
  constructor(private readonly svc: MockInterviewService) {}

  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  @Post('start')
  @HttpCode(200)
  start(@Body() dto: StartInterviewDto, @Req() req: Request) {
    return this.svc.start({
      userId: (req as any).user.sub,
      role: dto.role,
      company: dto.company,
      difficulty: dto.difficulty,
    });
  }

  /**
   * SSE endpoint for streaming the next AI question.
   *
   * IMPORTANT: SSE requests don't carry cookies in some browsers (EventSource
   * doesn't allow custom headers / withCredentials needs explicit init). We
   * accept an explicit auth via cookie only — the existing UserJwtAuthGuard
   * handles it, and we manually validate CSRF since we can't use the standard
   * write-method check (SSE is GET-like over HTTP POST).
   *
   * Frontend uses fetch() with ReadableStream rather than EventSource to get
   * proper CSRF + cookie behavior — that's why this is a POST endpoint with
   * application/event-stream response.
   */
  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Manual auth — we can't use @UseGuards here because we need to start the
    // SSE stream before any 200 OK can be sent, but the guard would set headers.
    const cookieToken = (req as any).cookies?.tch_user_token;
    if (!cookieToken) throw new UnauthorizedException();
    let userId: string;
    try {
      const payload: any = jwt.verify(cookieToken, process.env.JWT_SECRET || '');
      if (payload?.role !== 'user') throw new UnauthorizedException();
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException();
    }

    // CSRF check (standard write protection)
    const csrfHeader = req.headers['x-csrf-token'] as string;
    const csrfCookie = (req as any).cookies?.csrf_user_token;
    const tokensMatch =
      csrfHeader && csrfCookie &&
      csrfHeader.length === csrfCookie.length &&
      crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(csrfCookie));
    if (!tokensMatch) throw new ForbiddenException('Invalid CSRF token');

    // ── Begin SSE stream ──────────────────────────────────────────────────
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // Disable proxy buffering (matters on some PaaS like Render)
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    try {
      for await (const event of this.svc.streamMessage({
        interviewId: id,
        userId,
        message: dto.message,
      })) {
        // SSE format: lines starting with "data:" — \n\n terminator
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err?.message || 'Stream failed' })}\n\n`);
    } finally {
      res.end();
    }
  }

  @UseGuards(UserJwtAuthGuard)
  @Post(':id/complete')
  @HttpCode(200)
  async complete(@Param('id') id: string, @Req() req: Request): Promise<any> {
    return this.svc.complete({ interviewId: id, userId: (req as any).user.sub });
  }

  /** Public read of completed interview by share token (for the result card). */
  @Get('share/:token')
  share(@Param('token') token: string) {
    return this.svc.getByToken(token);
  }

  @UseGuards(UserJwtAuthGuard)
  @Get()
  listMine(@Req() req: Request) {
    return this.svc.listMine((req as any).user.sub);
  }
}
