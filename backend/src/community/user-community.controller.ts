import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserCommunityService } from './user-community.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

class AskDto {
  @IsString() @Length(10, 200) title: string;
  @IsString() @Length(20, 4000) question: string;
  @IsOptional() @IsString() @MaxLength(200) tags?: string;
}

class AnswerDto {
  @IsString() @Length(20, 5000) content: string;
}

/**
 * Mounted under /community/x to coexist with the existing admin CommunityController
 * (which owns /community CRUD). Distinct path prefix avoids route collisions.
 */
@Controller('community/x')
export class UserCommunityController {
  constructor(private readonly svc: UserCommunityService) {}

  /** Question detail — public read with optional viewer context. */
  @Get('questions/:id')
  detail(@Param('id') id: string, @Req() req: Request) {
    return this.svc.getDetail(id, this.extractOptionalUserId(req));
  }

  // ── Ask question ──────────────────────────────────────────────────────────
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('questions')
  @HttpCode(200)
  ask(@Body() dto: AskDto, @Req() req: Request) {
    return this.svc.askQuestion((req as any).user.sub, dto);
  }

  // ── Vote on question ──────────────────────────────────────────────────────
  @UseGuards(UserJwtAuthGuard)
  @Post('questions/:id/vote')
  @HttpCode(200)
  voteQuestion(@Param('id') id: string, @Req() req: Request) {
    return this.svc.toggleQuestionVote((req as any).user.sub, id);
  }

  // ── Bookmark question ─────────────────────────────────────────────────────
  @UseGuards(UserJwtAuthGuard)
  @Post('questions/:id/bookmark')
  @HttpCode(200)
  bookmark(@Param('id') id: string, @Req() req: Request) {
    return this.svc.toggleBookmark((req as any).user.sub, id);
  }

  @UseGuards(UserJwtAuthGuard)
  @Get('bookmarks')
  listBookmarks(@Req() req: Request) {
    return this.svc.listBookmarks((req as any).user.sub);
  }

  // ── Answers ───────────────────────────────────────────────────────────────
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('questions/:id/answers')
  @HttpCode(200)
  answer(@Param('id') id: string, @Body() dto: AnswerDto, @Req() req: Request) {
    return this.svc.addAnswer((req as any).user.sub, id, dto.content);
  }

  @UseGuards(UserJwtAuthGuard)
  @Delete('answers/:id')
  deleteAnswer(@Param('id') id: string, @Req() req: Request) {
    return this.svc.deleteOwnAnswer((req as any).user.sub, id);
  }

  @UseGuards(UserJwtAuthGuard)
  @Post('answers/:id/vote')
  @HttpCode(200)
  voteAnswer(@Param('id') id: string, @Req() req: Request) {
    return this.svc.toggleAnswerVote((req as any).user.sub, id);
  }

  @UseGuards(UserJwtAuthGuard)
  @Post('answers/:id/accept')
  @HttpCode(200)
  accept(@Param('id') id: string, @Req() req: Request) {
    return this.svc.acceptAnswer((req as any).user.sub, id);
  }

  /** Decode user JWT WITHOUT enforcing — for the public detail endpoint
   *  that personalizes per viewer when signed in. Same pattern as Phase 3. */
  private extractOptionalUserId(req: Request): string | null {
    try {
      const cookieToken = (req as any).cookies?.tch_user_token;
      if (!cookieToken) return null;
      const payload: any = jwt.verify(cookieToken, process.env.JWT_SECRET || '');
      return payload?.role === 'user' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
