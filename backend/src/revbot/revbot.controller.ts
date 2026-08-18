import { Body, Controller, ForbiddenException, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { RevBotService } from './revbot.service';
import { RevBotChatDto } from './dto/chat.dto';

@Controller('revbot')
export class RevBotController {
  constructor(private readonly svc: RevBotService) {}

  // SSE chat endpoint — same auth pattern as mock-interview/:id/message
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  @Post('chat')
  async chat(@Body() dto: RevBotChatDto, @Req() req: Request, @Res() res: Response) {
    // Manual auth (SSE requires custom response headers)
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

    // CSRF
    const csrfHeader = req.headers['x-csrf-token'] as string;
    const csrfCookie = (req as any).cookies?.csrf_user_token;
    const tokensMatch =
      csrfHeader && csrfCookie &&
      csrfHeader.length === csrfCookie.length &&
      crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(csrfCookie));
    if (!tokensMatch) throw new ForbiddenException('Invalid CSRF token');

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    try {
      for await (const event of this.svc.streamReply({ userId, history: dto.messages })) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err?.message || 'Stream failed' })}\n\n`);
    } finally {
      res.end();
    }
  }
}
