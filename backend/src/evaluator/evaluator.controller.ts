import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { EvaluatorService } from './evaluator.service';
import { EvaluateAnswerDto } from './dto/evaluate.dto';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('evaluator')
export class EvaluatorController {
  constructor(private readonly svc: EvaluatorService) {}

  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('evaluate')
  @HttpCode(200)
  evaluate(@Body() dto: EvaluateAnswerDto, @Req() req: Request) {
    return this.svc.evaluateUserAnswer({
      userId: (req as any).user.sub,
      questionId: dto.question_id ?? null,
      questionText: dto.question_text,
      answer: dto.answer,
    });
  }

  @UseGuards(UserJwtAuthGuard)
  @Get('me/recent')
  myRecent(@Req() req: Request) {
    return this.svc.myRecentEvaluations((req as any).user.sub);
  }
}
